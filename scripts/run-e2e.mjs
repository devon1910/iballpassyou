import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";
import next from "next";

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
  const test=spawn(process.execPath,["node_modules/@playwright/test/cli.js","test"],{stdio:"inherit",env:{...process.env,PLAYWRIGHT_BASE_URL:baseURL}});
  exitCode=Number(await new Promise(resolve=>test.on("exit",value=>resolve(value??1))));
}finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  await app.close();
}
process.exit(exitCode);
