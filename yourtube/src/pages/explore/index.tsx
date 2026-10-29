import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";

export default function ExplorePage() {
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Explore videos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse videos and discover something new.
        </p>
      </div>
      <CategoryTabs />
      <Videogrid />
    </main>
  );
}
