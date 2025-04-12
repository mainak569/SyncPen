"use client";

import { useState } from "react";
import SplashScreen from "./_components/splashScreen";
import AboutMarketing from "./_components/aboutMarketing";
import ChatBox from "./_components/chatBox";
import Footer from "./_components/footer";
import Heading from "./_components/heading";
import Heroes from "./_components/heroes";

const MarketingPage = () => {
  const [showMain, setShowMain] = useState(false);

  return (
    <>
      {!showMain && <SplashScreen onFinish={() => setShowMain(true)} />}

      {showMain && (
        <div className="min-h-full flex flex-col dark:bg-[#1F1F1F]">
          <div
            className="flex flex-col items-center justify-center 
            md:justify-start text-center gap-y-8 flex-1 px-6 pb-10"
          >
            <Heading />
            <Heroes />
            <AboutMarketing />
            <ChatBox />
          </div>
          <Footer />
        </div>
      )}
    </>
  );
};

export default MarketingPage;
