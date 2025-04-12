import Image from "next/image";

const Heroes = () => {
  return (
    <div className="flex flex-col items-center justify-center max-w-5xl">
      <div className="flex items-center">
        <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px]">
          <Image
            src="/reading.svg"
            fill
            className="object-contain dark:hidden"
            alt="Reading"
          />
          <Image
            src="/reading_dark.svg"
            fill
            className="object-contain hidden dark:block"
            alt="Reading-dark"
          />
        </div>
        <div className="relative w-[400px] h-[400px] hidden md:block">
          <Image
            src="/documents.svg"
            fill
            className="object-contain dark:hidden"
            alt="Documents"
          />
          <Image
            src="/documents_dark.svg"
            fill
            className="object-contain hidden dark:block"
            alt="Documents-dark"
          />
        </div>
      </div>
    </div>
  );
};

export default Heroes;
