"use client";

import { useEffect, useState } from "react";
import { SettingsModal } from "@/components/modals/settings-modal";
import { CoverImageNotesModal } from "@/components/modals/cover-image-notes-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <SettingsModal />
      <CoverImageNotesModal />
    </>
  );
};
