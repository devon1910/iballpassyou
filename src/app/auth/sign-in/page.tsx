import { Brand } from "@/components/brand";
import { SignInForm } from "@/components/sign-in-form";
export const metadata={title:"Sign in"};
export default function SignInPage(){return <main className="shell"><div style={{paddingTop:28}}><Brand/></div><div className="page-head"><p className="eyebrow">Owners and admins</p><h1>SIGN IN</h1><p className="lede">No password. We’ll email you a one-time sign-in link.</p></div><SignInForm/></main>;}
