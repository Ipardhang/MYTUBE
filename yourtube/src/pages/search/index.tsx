import SearchResult from "@/components/SearchResult";
import { useRouter } from "next/router";
import React, { Suspense } from "react";

const index = () => {
  const router = useRouter();
  const { q } = router.query;
  const searchTerm = typeof q === "string" ? q : Array.isArray(q) ? q[0] || "" : "";
  return (
    <div className="flex-1 p-4">
      <div className="max-w-6xl">
        {searchTerm && (
          <div className="mb-6">
            <h1 className="text-xl font-medium mb-4">
              Search results for "{searchTerm}"
            </h1>
          </div>
        )}
        <Suspense fallback={<div>Loading search results...</div>}>
          <SearchResult query={searchTerm} />
        </Suspense>
      </div>
    </div>
  );
};

export default index;
