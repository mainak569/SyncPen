"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "next-themes";
import Logo from "@/components/logo";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

interface CanvasProps {
  initialContent?: string;
  onSaveContent: (content: string) => void;
  editable?: boolean;
}

// Excalidraw fires onChange on every pointer move; without this each one
// would be a full board write to the database.
const SAVE_DELAY_MS = 500;

const Canvas: React.FC<CanvasProps> = ({
  initialContent,
  onSaveContent,
  editable = true,
}) => {
  const { resolvedTheme } = useTheme();

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  // Parsed once: Excalidraw only reads initialData on mount, and re-parsing a
  // large board on every render is wasted work.
  const initialScene = useMemo(() => {
    try {
      const parsedContent = initialContent ? JSON.parse(initialContent) : {};
      const saved = parsedContent.appState ?? {};

      return {
        elements: Array.isArray(parsedContent.elements)
          ? parsedContent.elements
          : [],
        // The viewport is saved on every change; restore it so a board reopens
        // where it was left instead of snapping back to the origin.
        viewport: {
          ...(typeof saved.scrollX === "number" && { scrollX: saved.scrollX }),
          ...(typeof saved.scrollY === "number" && { scrollY: saved.scrollY }),
          ...(typeof saved.zoom?.value === "number" && { zoom: saved.zoom }),
        },
      };
    } catch (error) {
      console.error("Error parsing initialContent:", error);
      return { elements: [], viewport: {} };
    }
  }, [initialContent]);

  // Kept in a ref so the debounce timer is not reset every render just because
  // the parent passes a fresh onSaveContent closure.
  const onSaveContentRef = useRef(onSaveContent);
  useEffect(() => {
    onSaveContentRef.current = onSaveContent;
  }, [onSaveContent]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      if (!editable || !excalidrawAPI) return;

      // Get current app state for scroll position preservation
      const appState = excalidrawAPI.getAppState(); // Serialize and save content

      // Serialize and save content
      const content = JSON.stringify({
        elements,
        appState: {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        },
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onSaveContentRef.current(content);
      }, SAVE_DELAY_MS);
    },
    [editable, excalidrawAPI]
  );

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: initialScene.elements,
          appState: {
            ...initialScene.viewport,
            theme: resolvedTheme === "dark" ? "dark" : "light",
          },
        }}
        onChange={handleChange}
        // Published boards are read-only: hide the drawing tools rather than
        // letting a visitor draw strokes that silently never save.
        viewModeEnabled={!editable}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        UIOptions={{
          tools: {
            image: false,
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Center>
            <Logo />
            <WelcomeScreen.Center.Heading>
              Welcome to SyncPen !
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
};

export default Canvas;
