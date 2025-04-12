import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import Image from "next/image";
import Spline from "@splinetool/react-spline";

const AboutMarketing = () => {
  return (
    <>
      <div className="flex [@media(min-width:1030px)]:flex-row flex-col items-center justify-center gap-6">
        <CardContainer className="inter-var">
          <CardBody className="bg-gray-50 relative group/card hover:shadow-2xl hover:shadow-[#F59E0B]/[0.25] dark:hover:shadow-[#3B82F6]/[0.25] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              Draw it, share it, build it
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
            >
              Transform your thoughts into visuals with your team, no matter
              where they are. Make decisions faster and stay in sync. Stay
              aligned and keep the creative flow moving.
            </CardItem>
            <CardItem
              translateZ="100"
              rotateX={20}
              rotateZ={-10}
              className="w-full mt-4"
            >
              <Image
                src="/card0.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl dark:hidden"
                alt="thumbnail"
              />
              <Image
                src="/card0_dark.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl hidden dark:block"
                alt="thumbnail"
              />
            </CardItem>
            <div className="flex justify-between items-center mt-20 text-neutral-500 text-sm max-w-sm dark:text-neutral-300">
              From scribbles to solutions. Brainstorm, design, and plan from
              anywhere because great ideas don't wait.
            </div>
          </CardBody>
        </CardContainer>
        <CardContainer className="inter-var">
          <CardBody className="bg-gray-50 relative group/card hover:shadow-2xl hover:shadow-[#F59E0B]/[0.25] dark:hover:shadow-[#3B82F6]/[0.25] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              Share it, show it, ship it
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
            >
              Publish your notes and boards effortlessly to keep your team in
              the loop. Whether it's a quick sketch or a detailed plan, get
              feedback faster and stay aligned.
            </CardItem>
            <CardItem
              translateZ="100"
              rotateX={20}
              rotateZ={-10}
              className="w-full mt-4"
            >
              <Image
                src="/card3.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl dark:hidden"
                alt="thumbnail"
              />
              <Image
                src="/card3_dark.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl hidden dark:block"
                alt="thumbnail"
              />
            </CardItem>
            <div className="flex justify-between items-center mt-20 text-neutral-500 text-sm max-w-sm dark:text-neutral-300">
              From private thoughts to public plans. Present, and keep everyone
              on the same page — anytime, anywhere.
            </div>
          </CardBody>
        </CardContainer>
      </div>
      <div className="flex [@media(min-width:1030px)]:flex-row flex-col items-center justify-center gap-6">
        <CardContainer className="inter-var">
          <CardBody className="bg-gray-50 relative group/card hover:shadow-2xl hover:shadow-[#F59E0B]/[0.25] dark:hover:shadow-[#3B82F6]/[0.25] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              Empower Your Workflow
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
            >
              Work seamlessly with SyncPen! Share notes with friends, family, or
              colleagues in real time. Publish notes online and share them
              effortlessly.
            </CardItem>
            <CardItem
              translateZ="100"
              rotateX={20}
              rotateZ={-10}
              className="w-full mt-4"
            >
              <Image
                src="/card1.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl dark:hidden"
                alt="thumbnail"
              />
              <Image
                src="/card1_dark.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl hidden dark:block"
                alt="thumbnail"
              />
            </CardItem>
            <div className="flex justify-between items-center mt-20 text-neutral-500 text-sm max-w-sm dark:text-neutral-300">
              Enhance teamwork and productivity by keeping everyone on the same
              page, no matter where they are ...
            </div>
          </CardBody>
        </CardContainer>
        <CardContainer className="inter-var">
          <CardBody className="bg-gray-50 relative group/card hover:shadow-2xl hover:shadow-[#F59E0B]/[0.25] dark:hover:shadow-[#3B82F6]/[0.25] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              Your Digital Productivity Hub
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
            >
              Use digital ink to sketch, annotate, and highlight your thoughts
              with precision and ease. Empower students and teachers with
              structured, digital notebooks.
            </CardItem>
            <CardItem
              translateZ="100"
              rotateX={20}
              rotateZ={-10}
              className="w-full mt-4"
            >
              <Image
                src="/card2.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl dark:hidden"
                alt="thumbnail"
              />
              <Image
                src="/card2_dark.svg"
                height="1000"
                width="1000"
                className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl hidden dark:block"
                alt="thumbnail"
              />
            </CardItem>
            <div className="flex justify-between items-center mt-20 text-neutral-500 text-sm max-w-sm dark:text-neutral-300">
              All in one powerful place, designed to fuel your creativity, and
              elevate productivity like never before !
            </div>
          </CardBody>
        </CardContainer>
      </div>
    </>
  );
};

export default AboutMarketing;
