import { describe,expect,it } from "vitest";import { applyPastedRoster,matchRoster,parseRoster } from "./roster";import type { Player } from "@/types/domain";
describe("roster parser",()=>{it.each([["1. Davidson\n2. Sean",["Davidson","Sean"]],["- Davidson\n• Sean",["Davidson","Sean"]],["Davidson, Sean",["Davidson","Sean"]],["⚽ Davidson ✅\n☑️ Sean!",["Davidson","Sean"]],["12. ⁠Jonathan\n13. ⁠Kola\n14. ⁠Lavigz",["Jonathan","Kola","Lavigz"]]])("parses conservative chat lists",(input,want)=>expect(parseRoster(input)).toEqual(want));it("matches case-insensitively and surfaces unknown names",()=>{const players:Player[]=[{id:"1",name:"Davidson",active:true}];expect(matchRoster("DAVIDSON\nMikel",players).map(r=>r.status)).toEqual(["matched","unmatched"])});it("never silently merges ambiguity",()=>{const players:Player[]=[{id:"1",name:"John Doe",active:true},{id:"2",name:"John-Doe",active:true}];expect(matchRoster("John Doe",players)[0].status).toBe("ambiguous")})});

it("reselects a draft-only player when the same chat list is checked again",()=>{
  const groupPlayers:Player[]=[{id:"devon",name:"Devon",active:true}];
  const draft=[
    {id:"devon",name:"Devon",selected:false,team:-1,goals:0,assists:0},
    {id:"new-kola",name:"Kola",selected:false,team:0,goals:0,assists:0,isNew:true},
  ];
  const result=applyPastedRoster("1. Devon\n2. ⁠Kola",draft,groupPlayers);
  expect(result.players.map(player=>[player.name,player.selected])).toEqual([["Devon",true],["Kola",true]]);
  expect(result.players).toHaveLength(2);
});

it("adds an unknown pasted player once even when the list repeats the name",()=>{
  const result=applyPastedRoster("Kola\n⁠Kola",[],[]);
  expect(result.players).toMatchObject([{id:"new-kola",name:"Kola",selected:true,isNew:true}]);
});

it("keeps all 15 players in the reported WhatsApp list",()=>{
  const input="1. Devon\n2. ⁠Uche\n3. Gbolly\n4. ⁠Sagaz\n5. ⁠Ijesha\n6. ⁠agbaso\n7. ⁠Chappy\n8. ⁠senna\n9. ⁠Sammy\n10. ⁠ chukwuemeka\n11. ⁠Nnamdi \n12. ⁠Jonathan\n13. ⁠Kola\n14. ⁠Lavigz\n15. ⁠Samson";
  expect(parseRoster(input)).toEqual(["Devon","Uche","Gbolly","Sagaz","Ijesha","agbaso","Chappy","senna","Sammy","chukwuemeka","Nnamdi","Jonathan","Kola","Lavigz","Samson"]);
  expect(applyPastedRoster(input,[],[]).players).toHaveLength(15);
});
