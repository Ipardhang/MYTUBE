"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

const categories = [
  "All",
  "Music",
  "Gaming",
  "Movies",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
  "Other",
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("All");
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const category = typeof router.query.category === "string" ? router.query.category : "All";
    setActiveCategory(category);
  }, [router.isReady, router.query.category]);

  const chooseCategory = (category: string) => {
    setActiveCategory(category);
    const query = { ...router.query };
    if (category === "All") delete query.category;
    else query.category = category;
    void router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? "default" : "secondary"}
          className="whitespace-nowrap"
          onClick={() => chooseCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
