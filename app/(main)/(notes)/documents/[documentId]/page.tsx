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
import ChatBox from "./_components/chatBox";

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
    update({
      id: resolvedParams.documentId,
      content: content,
    });
  };
  //////////////////////////////////////////////////////////////

  const extractedText = useMemo(() => {
    if (!document?.content) return "";
    try {
      const parsedContent = parseDocumentContent(document.content);
      return extractTextFromDocument(parsedContent);
    } catch (error) {
      console.error("Error extracting document text:", error);
      return "";
    }
  }, [document?.content]);

  //////////////////////////////////////////////////////////////

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
    <div className="pb-40">
      <CoverNotes url={document.coverImage} />
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
        <ToolbarNotes initialData={document} />
        <Editor
          onChange={onChange}
          initialContent={
            document.content && document.content !== "[]"
              ? document.content
              : "[]"
          }
        />
        {/* passing context of the editor as a prop */}
        <ChatBox pageData={extractedText} />
      </div>
    </div>
  );
};

export default DocumentIdPage;

//////////////////////////////////////////////////////////////

type DocumentNode = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: DocumentNode[];
};

function isTextNode(node: unknown): node is { type: string; text: string } {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "text" in node &&
    (node as any).type === "text"
  );
}

const extractTextFromDocument = (nodes: DocumentNode[]): string => {
  const traverseNodes = (items: DocumentNode[]): string[] => {
    return items.flatMap((item) => {
      const result: string[] = [];

      if (Array.isArray(item.content)) {
        item.content.forEach((contentItem) => {
          if (
            typeof contentItem === "object" &&
            contentItem !== null &&
            "type" in contentItem &&
            "text" in contentItem &&
            (contentItem as any).type === "text"
          ) {
            result.push((contentItem as any).text);
          }
        });
      }

      if (Array.isArray(item.children)) {
        result.push(...traverseNodes(item.children));
      }

      if (
        item.type === "table" &&
        typeof item.content === "object" &&
        item.content !== null &&
        "rows" in item.content &&
        Array.isArray((item.content as any).rows)
      ) {
        const rows = (
          item.content as { rows: { cells: { content: unknown }[] }[] }
        ).rows;
        rows.forEach((row) => {
          row.cells.forEach((cell) => {
            if (Array.isArray(cell.content)) {
              cell.content.forEach((cellContent) => {
                if (
                  typeof cellContent === "object" &&
                  cellContent !== null &&
                  "type" in cellContent &&
                  "text" in cellContent &&
                  (cellContent as any).type === "text"
                ) {
                  result.push((cellContent as any).text);
                }
              });
            }
          });
        });
      }

      return result;
    });
  };

  return traverseNodes(nodes).join(" ");
};

// Check if document.content is a string and parse it
const parseDocumentContent = (content: unknown): DocumentNode[] => {
  try {
    if (typeof content === "string") {
      return JSON.parse(content) as DocumentNode[];
    } else if (Array.isArray(content)) {
      return content as DocumentNode[];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error parsing document content:", error);
    return [];
  }
};
