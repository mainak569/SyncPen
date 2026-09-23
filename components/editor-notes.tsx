"use client";

import { useTheme } from "next-themes";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import { useCallback, useEffect, useRef } from "react";

// using EdgeStore with BlockNote
import { useEdgeStore } from "@/lib/edgestore";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const SAVE_DELAY_MS = 500;

const parseInitialContent = (
  initialContent?: string
): PartialBlock[] | undefined => {
  if (!initialContent || initialContent === "[]") return undefined;
  try {
    const parsed = JSON.parse(initialContent) as PartialBlock[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
  } catch {
    // A malformed document should open empty rather than crash the editor.
    console.error("Failed to parse note content, starting from an empty note.");
    return undefined;
  }
};

const EditorNotes = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  // Read-only previews must never write back: the viewer of a published note
  // is usually not its owner, so the update mutation would fail as Unauthorized.
  const isEditable = editable !== false;

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({
      file,
    });
    return response.url;
  };

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: parseInitialContent(initialContent),
    uploadFile: handleUpload,
  });

  // Kept in a ref so the debounce timer is not torn down every render just
  // because the parent passes a fresh onChange closure.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BlockNote fires on every keystroke; without this each one is a DB write.
  const handleChange = useCallback(() => {
    if (!isEditable) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChangeRef.current(JSON.stringify(editor.document, null, 2));
    }, SAVE_DELAY_MS);
  }, [editor, isEditable]);

  // Don't drop the last edit if the page unmounts mid-debounce.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (isEditable) {
          onChangeRef.current(JSON.stringify(editor.document, null, 2));
        }
      }
    };
  }, [editor, isEditable]);

  return (
    <div>
      <BlockNoteView
        editor={editor}
        editable={isEditable}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
};

export default EditorNotes;
