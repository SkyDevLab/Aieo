import { UrlAnalyzer } from '@/components/UrlAnalyzer';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)]">
      <UrlAnalyzer />
    </div>
  );
}
