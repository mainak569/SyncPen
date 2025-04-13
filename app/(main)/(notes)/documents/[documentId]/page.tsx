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

// Define a text node type explicitly
type TextNode = {
  type: "text";
  text: string;
};

function isTextNode(node: unknown): node is TextNode {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as Record<string, unknown>).type === "text" &&
    typeof (node as Record<string, unknown>).text === "string"
  );
}

const extractTextFromDocument = (nodes: DocumentNode[]): string => {
  const extractedText: string[] = [];

  const traverseNodes = (items: DocumentNode[]) => {
    items.forEach((item) => {
      // Handle content array
      if (Array.isArray(item.content)) {
        item.content.forEach((contentItem) => {
          if (isTextNode(contentItem)) {
            extractedText.push(contentItem.text);
          }
        });
      }

      // Recursively process children
      if (Array.isArray(item.children)) {
        traverseNodes(item.children);
      }

      // Handle tables
      if (
        item.type === "table" &&
        typeof item.content === "object" &&
        item.content !== null &&
        "rows" in item.content
      ) {
        const tableContent = item.content as {
          rows: { cells: { content: unknown[] }[] }[];
        };

        tableContent.rows.forEach((row) => {
          row.cells.forEach((cell) => {
            cell.content.forEach((cellContent) => {
              if (isTextNode(cellContent)) {
                extractedText.push(cellContent.text);
              }
            });
          });
        });
      }
    });
  };

  traverseNodes(nodes);
  return extractedText.join(" ");
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
