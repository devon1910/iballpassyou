import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";
import next from "next";

// These tests use demo fixtures. Isolate both build-time client constants and the
// server from .env.local so browser tests never read or write a real group.
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
const build = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], { stdio: "inherit", env: process.env });
const buildExit = await new Promise((resolve, reject) => { build.on("error", reject); build.on("exit", code => resolve(code ?? 1)); });
if (buildExit !== 0) process.exit(Number(buildExit));

const app=next({dev:false,dir:process.cwd()});
await app.prepare();
const handler=app.getRequestHandler();
const server=createServer((request,response)=>handler(request,response));
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const address=server.address();
if(!address||typeof address==="string")throw new Error("Could not allocate an E2E server port.");
const baseURL=`http://127.0.0.1:${address.port}`;
let exitCode=1;
try{
  const test=spawn(process.execPath,["node_modules/@playwright/test/cli.js","test",...process.argv.slice(2)],{stdio:"inherit",env:{...process.env,PLAYWRIGHT_BASE_URL:baseURL}});
  exitCode=Number(await new Promise(resolve=>test.on("exit",value=>resolve(value??1))));
}finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  await app.close();
}
process.exit(exitCode);
