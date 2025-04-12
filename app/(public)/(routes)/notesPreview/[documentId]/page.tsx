"use client";

import { use } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { CoverNotes } from "@/components/cover-notes";
import { ToolbarNotes } from "@/components/toolbar-notes";
import { Skeleton } from "@/components/ui/skeleton";

import dynamic from "next/dynamic";
import { useMemo } from "react";

interface DocumentIdPageProps {
  params: Promise<{
    documentId: Id<"documents">;
  }>;
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor-notes"), { ssr: false }),
    []
  );
  const resolvedParams = use(params); // Unwrap the params Promise
  const document = useQuery(api.documents.getById, {
    documentId: resolvedParams.documentId, // Use the unwrapped params
  });

  const update = useMutation(api.documents.update);

  const onChange = (content: string) => {
    console.log("Invoked onChange : ", content);
    update({
      id: resolvedParams.documentId,
      content: content,
    });
  };

  if (document === undefined) {
    return (
      <div>
        <CoverNotes.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found</div>;
  }

  return (
    <div className="pb-40 dark:bg-[#1F1F1F]">
      <CoverNotes preview url={document.coverImage} />
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
        <ToolbarNotes preview initialData={document} />
        <Editor
          editable={false}
          onChange={onChange}
          initialContent={
            document.content && document.content !== "[]"
              ? document.content
              : "[]"
          }
        />
      </div>
    </div>
  );
};

export default DocumentIdPage;
