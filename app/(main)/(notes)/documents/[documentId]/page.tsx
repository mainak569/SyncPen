"use client";

import { use, useEffect } from "react";
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

  // useEffect(() => {
  //   console.log("Extracted Document Text:\n", extractedText);
  // }, [extractedText]);

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

type AnyNode = {
  id: string;
  type: string;
  props?: Record<string, any>;
  content?: any;
  children?: AnyNode[];
};

//////////////////////////////////////////////////////////////

type DocumentNode = {
  id: string;
  type: string;
  props?: Record<string, any>;
  content?: any;
  children?: DocumentNode[];
};

const extractTextFromDocument = (nodes: DocumentNode[]): string => {
  let extractedText: string[] = [];

  const traverseNodes = (items: DocumentNode[]) => {
    items.forEach((item) => {
      // If "content" exists and is an array
      if (Array.isArray(item.content)) {
        item.content.forEach((contentItem) => {
          const textNode = contentItem as { type: string; text: string };
          if (textNode.type === "text" && textNode.text) {
            extractedText.push(textNode.text);
          }
        });
      }

      // Recursively process children
      if (Array.isArray(item.children)) {
        traverseNodes(item.children);
      }

      // Handle table structures
      if (item.type === "table" && item.content?.rows) {
        item.content.rows.forEach((row: any) => {
          row.cells.forEach((cell: any) => {
            if (Array.isArray(cell.content)) {
              cell.content.forEach((cellContent: any) => {
                const textCell = cellContent as { type: string; text: string };
                if (textCell.type === "text" && textCell.text) {
                  extractedText.push(textCell.text);
                }
              });
            }
          });
        });
      }
    });
  };

  traverseNodes(nodes);
  return extractedText.join(" ");
};

// Check if document.content is a string and parse it
const parseDocumentContent = (content: string | any): DocumentNode[] => {
  try {
    return typeof content === "string"
      ? (JSON.parse(content) as DocumentNode[])
      : (content as DocumentNode[]);
  } catch (error) {
    console.error("Error parsing document content:", error);
    return [];
  }
};
