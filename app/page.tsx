import { ArchiveApp } from "@/src/components/ArchiveApp";
import { getCategories, getFiles, manifest } from "@/src/lib/content";
import { getArchiveAccess } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const access = await getArchiveAccess();

  return (
    <ArchiveApp
      files={getFiles()}
      categories={getCategories()}
      generatedAt={manifest.generatedAt}
      access={access}
    />
  );
}
