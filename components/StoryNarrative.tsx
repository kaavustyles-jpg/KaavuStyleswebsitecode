import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function StoryNarrative() {
  return (
    <section aria-labelledby="story-heading" className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
        <div data-reveal="left" className="relative group flex items-center justify-center px-6 pt-8 md:py-12 sm:px-10">
          <div className="relative w-48 sm:w-64 lg:w-80 aspect-[3/4] rounded-t-[999px] border-2 border-gold p-2 bg-ivory shadow-luxury">
            <div className="relative w-full h-full rounded-t-[990px] overflow-hidden">
              <Image src="/image.jpg" alt="Kaavu Styles atelier and drapery" fill sizes="(min-width: 1024px) 320px, (min-width: 640px) 256px, 192px" className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]" />
            </div>
          </div>
        </div>
        <div data-reveal="right" className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
          <div className="flex items-center gap-3 mb-5 sm:mb-7">
            <span className="w-8 h-px bg-gold" aria-hidden="true" />
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-gold font-medium">Our Story Narrative</p>
          </div>
          <h2 id="story-heading" className="font-serif text-[2.5rem] sm:text-5xl lg:text-6xl leading-[1.06] tracking-tight text-ink text-balance">
            Made for every <em className="font-normal text-crimson">version of you.</em>
          </h2>
          <p className="mt-5 sm:mt-7 text-sm sm:text-base leading-[1.85] text-ink-muted max-w-md">
            Kaavu Styles began with a simple idea: getting dressed should feel like a quiet ritual, not a decision. Each piece is chosen for its fall, its finish, and the way it makes you feel.
          </p>
          <blockquote className="border-l border-gold/60 pl-5 mt-6 sm:mt-8 max-w-md">
            <p className="font-serif text-xl sm:text-2xl leading-relaxed text-crimson italic">
              &ldquo;Rich maroon, soft gold, unhurried silhouettes. Clothing and adornment that belongs to every mood, every day.&rdquo;
            </p>
            <footer className="mt-3 text-[9px] uppercase tracking-[0.22em] text-gold">The Kaavu ethos</footer>
          </blockquote>
          <Link href="/story" className="group mt-8 sm:mt-10 inline-flex self-start items-center justify-center gap-5 bg-crimson text-ivory px-6 py-3.5 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-crimson-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson">
            Read full story <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
