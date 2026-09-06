import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start"],{stdio:"inherit",detached:process.platform!=="win32"});
const stop=()=>{if(!server.pid)return;if(process.platform==="win32")spawnSync("taskkill",["/pid",String(server.pid),"/T","/F"],{stdio:"ignore"});else try{process.kill(-server.pid,"SIGTERM")}catch{}};
let exitCode=1;
try{
  let ready=false;for(let attempt=0;attempt<60;attempt++){try{const response=await fetch("http://localhost:3000");if(response.ok){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,250))}
  if(!ready)throw new Error("Next.js did not become ready for Playwright.");
  const test=spawn(process.execPath,["node_modules/@playwright/test/cli.js","test"],{stdio:"inherit"});
  const code=await new Promise(resolve=>test.on("exit",value=>resolve(value??1)));exitCode=Number(code);
}finally{stop()}
process.exit(exitCode);
