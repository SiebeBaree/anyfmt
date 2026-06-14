import { Converter } from "@/components/converter";

export default function Home() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-2xl">
        <Converter />
      </div>
    </div>
  );
}
