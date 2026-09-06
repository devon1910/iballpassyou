import { SiteNav } from "@/components/site-nav";
import { CreateGroupForm } from "@/components/create-group-form";
export default function NewGroupPage(){return <main className="shell"><SiteNav backHref="/app"/><div className="page-head"><p className="eyebrow">New group</p><h1>START A TABLE</h1><p className="lede">Just the defaults. Every session can still be different.</p></div><CreateGroupForm/></main>}
