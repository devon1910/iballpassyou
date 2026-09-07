import { CreateGroupForm } from "@/components/create-group-form";
import { PhotoActionPage } from "@/components/photo-action-page";
import { SiteNav } from "@/components/site-nav";

export default function NewGroupPage() {
  return (
    <PhotoActionPage>
      <SiteNav backHref="/app" />
      <div className="page-head">
        <p className="eyebrow">New group</p>
        <h1>START A TABLE</h1>
        <p className="lede">Just the defaults. Every session can still be different.</p>
      </div>
      <CreateGroupForm />
    </PhotoActionPage>
  );
}
