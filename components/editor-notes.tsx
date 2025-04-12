"use client";

import { useTheme } from "next-themes";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import { useEffect } from "react";

// using EdgeStore with BlockNote
import { useEdgeStore } from "@/lib/edgestore";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const EditorNotes = ({ onChange, initialContent, editable }: EditorProps) => {
  const { theme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({
      file,
    });
    return response.url;
  };

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent:
      initialContent && initialContent !== "[]"
        ? (JSON.parse(initialContent) as PartialBlock[])
        : undefined, // Set to undefined when empty
    uploadFile: handleUpload,
  });

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const content = JSON.stringify(editor.document, null, 2);
      onChange(content);
    };

    // Run update whenever editor document changes
    const observer = new MutationObserver(handleUpdate);
    if (editor.domElement) {
      observer.observe(editor.domElement, { childList: true, subtree: true });
    }

    return () => observer.disconnect(); // Cleanup
  }, [editor, onChange]);

  return (
    <div>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme === "dark" ? "dark" : "light"}
      />
    </div>
  );
};

export default EditorNotes;
