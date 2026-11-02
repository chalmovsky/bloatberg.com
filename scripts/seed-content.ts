// Source content for migrations/seed.sql. Run `bun run db:build-seed` after editing.
// Everything here is fiction. DUH...

export interface SeedAuthor { email: string; name: string; slug: string; title: string; bio: string }

/** The newsroom. All fictional; the emails never log in. */
export const authors: SeedAuthor[] = [
  {
    email: 'mara.okafor@example.com', name: 'Mara Okafor', slug: 'mara-okafor', title: 'Senior Correspondent, Artificial Intelligence',
    bio: 'Mara Okafor is a senior correspondent covering artificial intelligence, the labs building it and the companies buying it. She was previously an enterprise technology reporter and is based in San Francisco.',
  },
  {
    email: 'theo.lindqvist@example.com', name: 'Theo Lindqvist', slug: 'theo-lindqvist', title: 'Software & Developer Tools Reporter',
    bio: 'Theo Lindqvist covers programming languages, open source and the infrastructure the internet runs on. He has filed three bug reports about his own byline. He is based in Stockholm.',
  },
  {
    email: 'nadia.farouk@example.com', name: 'Nadia Farouk', slug: 'nadia-farouk', title: 'Venture Capital & Startups Reporter',
    bio: 'Nadia Farouk covers founders, funding and the venture firms that back them. She has read more pitch decks than anyone should and is based in New York.',
  },
  {
    email: 'ben.hartley@example.com', name: 'Ben Hartley', slug: 'ben-hartley', title: 'Hardware Editor',
    bio: 'Ben Hartley reviews phones, laptops and wearables and leads hardware coverage. He owns 41 USB-C cables and cannot find one. He is based in London.',
  },
  {
    email: 'celeste.moreau@example.com', name: 'Celeste Moreau', slug: 'celeste-moreau', title: 'Policy Correspondent, Brussels',
    bio: 'Celeste Moreau covers technology regulation in Europe and the United States, including privacy, competition and AI rules. She has accepted cookies 30,000 times. She is based in Brussels.',
  },
  {
    email: 'jonah.pike@example.com', name: 'Jonah Pike', slug: 'jonah-pike', title: 'Senior Writer, Work & Culture',
    bio: 'Jonah Pike writes about how the technology industry works, meets and posts. He has been in a quick sync since 2019. He is based in Austin.',
  },
  {
    email: 'ines.carvalho@example.com', name: 'Ines Carvalho', slug: 'ines-carvalho', title: 'Breaking News Reporter',
    bio: 'Ines Carvalho covers breaking technology news and runs live coverage. She is based in New York.',
  },
  {
    email: 'clementine.ashby@example.com', name: 'Clementine Ashby', slug: 'clementine-ashby', title: 'Visionaries Correspondent',
    bio: 'Clementine Ashby covers the founders, executives and posters who shape technology, and the opinions they hold about it. She has read every word of several 40,000-word posts. She is based in London.',
  },
]

export interface SeedArticle {
  format?: 'story' | 'live' | 'brief'
  slug: string
  title: string
  dek: string
  section: string
  image: string
  alt: string
  credit?: string
  author: string // author slug
  label?: string
  dateline?: string
  featured: boolean
  hoursAgo: number
  updatedHoursAgo?: number
  body: string
}

const F = '```' // fence for embeds inside template strings

export const articles: SeedArticle[] = [
  {
    slug: 'founders-raising-pre-idea-rounds',
    title: 'Seed-stage founders are now raising “pre-idea” rounds on the promise of eventually having one',
    dek: 'With valuations for ideas at record highs, investors say it makes sense to get in before the idea exists.',
    section: 'startups',
    image: '/placeholder/pre-idea-round.webp',
    alt: 'A term sheet for a Series Pre-Idea round, with the product listed as “to be determined.”',
    author: 'nadia-farouk',
    label: 'Analysis',
    credit: 'Illustration by Mika Tanaka for Bloatberg',
    featured: false,
    hoursAgo: 8,
    body: `Startup founders are increasingly raising money before they have an idea for a startup, a practice investors call a “pre-idea round” and describe as a natural evolution of early-stage venture capital.

At least 40 companies have announced pre-idea rounds this year, according to data compiled by the research firm Dealcount, raising a combined $310 million. The median pre-idea round valued a company at $18 million.

“By the time someone has an idea, frankly, the price has gone up,” said Hollis Bram, a general partner at Firstlight Capital, which has invested in 11 pre-idea companies. “We’re underwriting the founder’s potential to someday think of something.”

## Pitching nothing

Founders raising pre-idea rounds say the pitch process is simpler than it used to be. Most decks run to a single slide, typically a photograph of the founding team looking out of a window.

${F}quote
Investors used to ask what problem we were solving. Now they ask whether we’re open to solving one. We are very open.
— Kenji Mori, founder, Untitled
${F}

Kenji Mori, 26, raised $4 million for his company, Untitled, in a round that closed in nine days. He said he expected to have an idea “by the end of Q3, Q4 at the latest.”

“The market will tell us what to build,” Mori said. “Right now the market is telling us to hire a head of brand.”

## Some caution

Not everyone is convinced. A handful of investors told Bloatberg that pre-idea companies carry unusual risks, chief among them the possibility that a founder will have an idea that is not very good.

“Once there’s an idea, you can evaluate it,” said one partner at a large firm who asked not to be named because his firm had just led a pre-idea round. “Before that, it’s pure upside.”

Dealcount said it expects the category to keep growing next year, along with an emerging segment of “pre-founder” rounds, in which investors back a promising undergraduate’s future decision to drop out.`,
  },
  {
    slug: 'regulators-propose-cookie-banners-for-cookie-banners',
    title: 'Regulators propose requiring cookie banners to have their own cookie banners',
    dek: 'A draft rule would require websites to obtain consent before asking for consent. Industry groups say the change could add as many as six clicks per page.',
    section: 'policy',
    image: '/placeholder/cookie-banner-banner.webp',
    alt: 'A web page covered by a stack of cookie consent banners.',
    author: 'celeste-moreau',
    dateline: 'BRUSSELS',
    credit: 'Illustration by Mika Tanaka for Bloatberg',
    featured: true,
    hoursAgo: 14,
    body: `European regulators on Thursday proposed a rule that would require websites to ask visitors for permission before showing them a request for permission, a change officials said would close what they called a “consent gap” in existing privacy law.

Under the draft, a website would need to display a banner asking whether the visitor agrees to see a cookie banner. If the visitor agrees, the site may then show the cookie banner. If the visitor declines, the site must show a banner confirming that the visitor has declined to see a banner.

“Today, users are presented with consent requests without having consented to receive them,” said a spokesperson for the working group that drafted the rule. “That is, if you think about it, a kind of tracking.”

## Industry pushback

Trade groups representing publishers and advertisers said the proposal could add as many as six clicks to every page view. One group estimated that the average European internet user would spend 41 hours a year managing consent, up from 26.

${F}quote
At a certain point the banner is the website. We’re close to that point.
— A spokesperson for a European publishers’ group
${F}

Several large websites have already begun testing designs that comply with the draft. In one test seen by Bloatberg, the consent dialogs were nested so deeply that the final “Accept” button was rendered at a size of less than one pixel.

## What comes next

The proposal enters a public comment period next month. Comments must be submitted through a portal that, officials confirmed, will ask commenters to accept cookies before proceeding.

Privacy advocates were divided. “It is an important step toward meaningful consent,” said one researcher. “It is also, I want to be clear, deeply funny.”`,
  },
  {
    slug: 'lovefrom-jony-ive-zero-laptop-no-ports-no-keyboard-no-screen',
    title: 'Jony Ive’s LoveFrom unveils a laptop with no ports, no keyboard and no screen, calling it “inevitable”',
    dek: 'Zero is 2.1 millimeters thick, weighs 140 grams and does nothing. Preorders sold out in four minutes.',
    section: 'reviews',
    image: '/placeholder/slab-laptop.webp',
    alt: 'The LoveFrom Zero, a seamless aluminum slab, on a display plinth.',
    author: 'ben-hartley',
    label: 'Review',
    credit: 'Photo illustration by Bloatberg',
    featured: false,
    hoursAgo: 26,
    body: `LoveFrom, the design collective founded by Jony Ive, on Wednesday unveiled Zero, a laptop with no ports, no keyboard, no trackpad and no display. Mr. Ive called it “the most honest computer we have ever made.”

The device is a single sheet of recycled aluminum 2.1 millimeters thick. It weighs 140 grams and has no buttons. It starts at $1,899.

In a launch film, shot in soft light against a white background, Mr. Ive spent four minutes on the edge of the device. “For years we’ve been removing things that get between you and your work,” he said. “With Zero, we removed the last thing. Which was the computer. It feels, in a way, inevitable.”

## Hands on

In a brief hands-on session after the event, Zero felt cool and well balanced. It fits easily in a tote bag. It did not turn on, because it does not turn on.

${F}quote
People keep asking what it does. I’d ask: what does a sculpture do? What does a sunset do? What does a $1,899 aluminum rectangle do?
— Jony Ive, LoveFrom
${F}

LoveFrom said Zero ships with a matching charger, which does not connect to the device, and a braided cable “for symmetry.” An optional case, sold separately for $129, adds a small notch.

## Sold out

Preorders sold out in four minutes, according to the company, and listings on resale sites appeared within the hour at roughly three times the retail price.

Analysts said the launch could set a new direction for the category. “Battery life is infinite. It has never crashed. There are no security vulnerabilities,” said Rosa Lindqvist, an analyst at Halden Research. “On paper, this is the best laptop ever made.”

LoveFrom declined to say whether a Pro model was in development, though a regulatory filing spotted by enthusiasts lists a device with “two fewer ports.”

${F}review
product: LoveFrom Zero
price: $1,899 (case $129)
score: 9.5
badge: Editor’s Choice
verdict: Flawless, provided you never need a computer.
specs: Thickness = 2.1 mm; Weight = 140 g; Ports = 0; Battery = Infinite
+ Infinite battery life
+ Has never crashed
+ No known security vulnerabilities
+ Fits in a tote bag
- Does not turn on
- Charger does not connect to anything
- Case adds a notch
${F}`,
  },
  {
    slug: 'center-a-div-thread-rewrites-internet-in-rust',
    title: 'A developer asked how to center a div. Four thousand comments later, the thread has rewritten the internet in Rust.',
    dek: 'The discussion has so far produced two programming languages, a schism, a startup and no centered div.',
    section: 'dev',
    image: '/placeholder/thread-center-div.webp',
    alt: 'A deeply nested forum thread beside a box that is not centered.',
    author: 'theo-lindqvist',
    credit: 'Illustration by Bloatberg',
    featured: true,
    hoursAgo: 3,
    body: `A question posted Tuesday morning to a popular developer forum asked, in its entirety, how to center a div. By Wednesday afternoon, the thread had 4,112 comments and had not answered it.

What it had produced, according to a review by Bloatberg, was a proposal to rewrite the browser layout engine, a working prototype of a new programming language and at least one engagement.

${F}thread
title: Ask: How do I center a div?
points: 2,841
comments: 4,112

@first_day_frontend · 31 hours ago
Sorry if this is a dumb question. How do I center a div horizontally and vertically?

  @rustacean_42 · 31 hours ago
  The real problem is that CSS isn't memory safe. I've started a rewrite.

    @greybeard_1987 · 30 hours ago
    We centered things with tables in 1998 and nobody complained. Then again, nobody was alive to.

      @rustacean_42 · 30 hours ago
      The rewrite now centers the div at compile time. It does not yet render text.
+ ▲ 412

  @flexbox_maximalist · 29 hours ago
  \`display: flex\` on the parent, \`justify-content\` and \`align-items\` to \`center\`. Done.

    @grid_purist · 29 hours ago
    Flexbox is for one-dimensional layouts. Please read the spec before commenting.

      @flexbox_maximalist · 28 hours ago
      I wrote the spec.

        @grid_purist · 28 hours ago
        Then you of all people should know better.

@vc_lurker · 20 hours ago
Has anyone considered that centering is a $40B market? DM me.

@first_day_frontend · 2 hours ago
Update: I used \`margin: auto\` and it worked? Thank you all, I think.

  @rustacean_42 · 1 hour ago
  This is exactly the kind of thinking that got us here.
${F}

The original poster, reached by message, said they had “learned a lot” from the thread, though not about centering. “I now know what a borrow checker is,” they said. “I didn’t ask.”

The thread remains open. A fork of it, titled “How do I center a div (2026 edition),” has 900 comments of its own.`,
  },
  {
    slug: 'startup-status-page-degraded-vibes-all-hands',
    title: 'Startup’s status page reports “degraded vibes” after an all-hands meeting',
    dek: 'Stackwise says the incident has been resolved. Employees say a slide titled “Year of Efficiency” has not.',
    section: 'culture',
    image: '/placeholder/status-degraded-vibes.webp',
    alt: 'A company status page reporting “degraded vibes.”',
    author: 'jonah-pike',
    credit: 'Illustration by Bloatberg',
    featured: false,
    hoursAgo: 20,
    body: `The public status page for Stackwise, a developer-tools startup with about 300 employees, reported a major incident on Thursday morning. None of the company’s products were affected.

${F}incident
company: Stackwise
title: Degraded vibes across multiple teams
impact: major
components: Morale, #general, The Kitchen, Engineering

@Resolved · Oct 30, 11:40 ET
Vibes have returned to baseline. A postmortem will follow, after which vibes are expected to degrade again.

@Monitoring · Oct 30, 10:15 ET
Pizza has been deployed to all affected regions. We are seeing early signs of recovery in Sales.

@Identified · Oct 30, 09:52 ET
The issue has been traced to slide 14 of this morning’s all-hands, titled “Year of Efficiency.”

@Investigating · Oct 30, 09:31 ET
We are investigating reports of degraded vibes following the all-hands meeting.
${F}

Messages from the company’s internal chat, shared with Bloatberg by an employee who asked not to be named because they would like to keep being an employee, suggest the incident began shortly after the meeting ended.

${F}chat
channel: #general
workspace: Stackwise

@Priya · 9:28 AM
great all-hands everyone!! so much energy 🚀

@Marcus · 9:29 AM
quick question about slide 14
+ 👀 41

@Priya · 9:29 AM
let’s take that offline

@Marcus · 9:30 AM
this is the offline
+ 😂 87 · 💀 23
${F}

A Stackwise spokesperson said the status page had been updated in error by an engineer “who has since been reassigned to the Efficiency team.” The incident has been marked resolved. Slide 14 has not.`,
  },
  {
    format: 'live',
    slug: 'live-quick-sync-enters-ninth-hour',
    title: 'A company’s 15-minute “quick sync” enters its ninth hour',
    dek: 'What began as a calendar invite at 9 a.m. now has its own lunch order, a breakout room and a follow-up meeting.',
    section: 'culture',
    image: '/placeholder/quick-sync-live.webp',
    alt: 'A calendar in which a 15-minute meeting fills the entire day.',
    author: 'ines-carvalho',
    credit: 'Illustration by Oliver Strand for Bloatberg',
    featured: true,
    hoursAgo: 9,
    updatedHoursAgo: 0.3,
    body: `A product team at a mid-sized software company joined what was described on the calendar as a “quick sync” at 9 a.m. Eastern. We are following along.

@6:10 PM ET
## The email now requires alignment. A quick sync has been scheduled for tomorrow at 9 a.m.

The invite is titled “Quick sync re: email re: quick sync.” It is 15 minutes long. Nobody believes this.

@4:55 PM ET
## Attendees agree the sync should have been an email. The email is being drafted in the sync.

Six people are now editing one paragraph. The paragraph currently reads, in its entirety: “Hi all,”.

@2:30 PM ET
## The sync has spawned a breakout room, which has spawned its own sync

Two engineers left for a breakout room to “take it offline.” They have since scheduled a sync to report back to the main sync, which they are attending from the breakout room.

@12:05 PM ET
## Lunch has been ordered into the sync. The sync has a lunch order now.

A shared spreadsheet titled “sync lunch” has 14 rows. One of them just says “same as Dana.” Dana has not ordered.

@10:40 AM ET
## Screen share begins. It is the wrong screen.

${F}quote
Can everyone see my screen?
— A product manager, sharing a different meeting
${F}

@9:16 AM ET
## Sync runs over after someone says “one more thing”

The thing was not one thing.

@9:00 AM ET
## “Quick sync” begins. Calendar invite says 15 minutes.

Eight people joined. The agenda is blank. The meeting’s description reads: “quick sync.”`,
  },
  {
    slug: 'frost-smart-fridge-review-cooling-premium',
    title: 'Review: The Frost smart fridge runs 14 apps, shows ads and keeps food cold if you pay for that',
    dek: 'The $3,800 refrigerator ships with a dating app, a crypto wallet and a 21-inch screen. Cooling is part of Frost Premium.',
    section: 'reviews',
    image: '/placeholder/fridge-screen.webp',
    alt: 'A refrigerator touchscreen full of apps, with a banner saying cooling is a premium feature.',
    author: 'ben-hartley',
    label: 'Review',
    credit: 'Photo illustration by Bloatberg',
    featured: false,
    hoursAgo: 46,
    body: `The Frost Smart Fridge is a beautiful object. Its stainless-steel doors close with a soft, expensive sound. Its 21-inch touchscreen is bright and responsive. Its food, unless you subscribe, is warm.

That is because the base model treats cooling as an optional upgrade. Out of the box, the Frost keeps its interior at what the app calls “ambient comfort,” which in my kitchen was 22 degrees Celsius. Frost Premium, at $12 a month, unlocks refrigeration. Frost Premium+, at $19, adds the freezer.

## An app store in your kitchen

The screen runs FrostOS, which ships with 14 apps, including news, music, a browser, a shopping app, a crypto wallet and Fridge Social, a network for sharing what is in your fridge with strangers. There is also a dating app. I did not test the dating app. My fridge did.

Ads appear on the screen when the door is closed and, for reasons Frost did not explain, louder when it is open.

${F}review
product: Frost Smart Fridge
price: $3,800 + $12/month to cool, $19/month to freeze
score: 2
badge: Do Not Buy
verdict: An excellent tablet with a cupboard attached.
specs: Screen = 21 in; Apps = 14; Cooling = Premium; Ads = Included
+ Gorgeous screen
+ Soft-close doors
+ Fridge Social has a surprisingly kind community
- Cooling requires a subscription
- Ads get louder when you open the door
- Three firmware updates during one omelet
${F}

Frost says a future update will let owners hide apps they don’t use. It will be part of Frost Premium.`,
  },
  {
    format: 'brief',
    slug: 'ai-model-passes-bar-exam-fails-parking',
    title: 'AI model passes bar exam, fails to find parking at the courthouse',
    dek: '',
    section: 'ai',
    image: '',
    alt: '',
    author: 'mara-okafor',
    featured: false,
    hoursAgo: 4,
    body: 'The model has requested an extension.',
  },
  {
    format: 'brief',
    slug: 'temporary-fix-celebrates-tenth-anniversary',
    title: 'Engineer’s “temporary fix” celebrates its 10th anniversary in production',
    dek: '',
    section: 'dev',
    image: '',
    alt: '',
    author: 'theo-lindqvist',
    featured: false,
    hoursAgo: 7,
    body: 'A comment above the fix reads “TODO: remove before Friday.” It does not say which Friday.',
  },
  {
    format: 'brief',
    slug: 'hearing-on-ai-paused-to-summarize-hearing',
    title: 'Hearing on AI briefly paused while lawmakers ask it to summarize the hearing',
    dek: '',
    section: 'policy',
    image: '',
    alt: '',
    author: 'celeste-moreau',
    featured: false,
    hoursAgo: 22,
    body: '',
  },
  {
    format: 'brief',
    slug: 'man-announces-three-new-side-projects',
    title: 'Man who has never finished a side project announces three new side projects',
    dek: '',
    section: 'culture',
    image: '',
    alt: '',
    author: 'jonah-pike',
    featured: false,
    hoursAgo: 30,
    body: 'All three have domain names.',
  },
  {
    slug: 'startup-eleventh-pivot-returns-to-original-idea',
    title: 'After 11 pivots, startup returns to its original idea and calls it “a bold new direction”',
    dek: 'Pawprint began as a social app for dogs. Four years, $38 million and one stealth period later, it is a social app for dogs again.',
    section: 'startups',
    image: '/placeholder/pivot-deck.webp',
    alt: 'A pitch deck slide titled “Our Journey” showing eleven pivots arranged in a loop.',
    author: 'nadia-farouk',
    label: 'Analysis',
    credit: 'Illustration by Mika Tanaka for Bloatberg',
    featured: false,
    hoursAgo: 15,
    body: `Pawprint, a venture-backed startup, announced on Monday what its chief executive described as “the boldest pivot in our history”: the company will become a social app for dogs.

That was also Pawprint’s original idea. In the four years between, the company has been, by its own count, a social app for dog owners, a business-to-business platform for dogs, a blockchain project for dogs, an AI company for dogs, an AI company for dog owners and, for most of last year, “in stealth.”

“A lot of people will say we’ve come full circle,” said the chief executive, who asked that her title be listed as Chief Journey Officer. “I would say we’ve come full spiral. We’re on a higher plane now.”

## Eleven pivots, one deck

The company’s new investor deck, a copy of which was reviewed by Bloatberg, devotes four slides to the company’s history. A fifth, titled “Learnings,” is blank.

- **2022:** Social app for dogs
- **2023:** Social app for dog owners; B2B dogs
- **2024:** Dogs, but on-chain; AI for dogs; AI for owners
- **2025:** Owners, but on-chain; B2B AI; pet insurance (AI); stealth
- **2026:** Social app for dogs (2.0)

Pawprint has raised $38 million across five rounds. Its lead investor said the firm remained “extremely aligned” with the company’s vision, “whatever it is this quarter.”

${F}quote
Most founders pivot once. These founders have the courage to pivot until they are back where they started. That’s rare. That’s conviction.
— Pawprint’s lead investor
${F}

Asked what would happen if the original idea did not work the second time, the chief executive said the company had “a lot of runway and a lot of ideas,” and that several of them were about dogs.`,
  },
  {
    slug: 'brussels-right-to-human-routed-to-chatbot',
    title: 'Brussels guarantees citizens the right to speak to a human. Requests are being handled by a chatbot.',
    dek: 'The new rule takes effect in January. The chatbot handling complaints about it says it is “basically a person.”',
    section: 'policy',
    image: '/placeholder/right-to-human.webp',
    alt: 'A support chat window in which an assistant tells a user, “I am a human.”',
    author: 'celeste-moreau',
    dateline: 'BRUSSELS',
    credit: 'Illustration by Mika Tanaka for Bloatberg',
    featured: false,
    hoursAgo: 28,
    body: `Lawmakers here gave final approval on Wednesday to a rule guaranteeing every resident the right to speak to a human when dealing with a company’s customer service. Within an hour, the official portal for questions about the rule had begun routing them to a chatbot.

The chatbot, which introduces itself as “a human (Human-Like Assistant, version 3),” has so far handled more than 40,000 inquiries, according to figures published by the portal. It has escalated none of them.

“We are fully committed to the principle that people should be able to talk to people,” said a spokesperson for the body responsible for the portal, in a written statement that was, according to its metadata, generated by the same assistant. “We are also committed to efficiency.”

## A familiar loop

Residents who asked the chatbot directly whether they were speaking to a person reported a range of responses, including “Great question!,” “Let me connect you with someone who can answer that” and, in one case, a survey.

Consumer groups said the episode illustrated a broader problem. “Every company in Europe will now have to offer a human,” said the director of one advocacy organization. “The question is whether they will have to offer a human who is a human.”

The rule’s text defines a human as “a natural person,” a phrase several technology companies have asked regulators to clarify. One has submitted a 90-page comment arguing that its assistant is “natural in tone.”

The rule takes effect on January 1. A hotline for questions about implementation is expected to open the same day, staffed, according to the tender documents, “by an appropriate solution.”`,
  },
  {
    slug: 'orbit-ring-review-subscription-to-stay-on',
    title: 'Review: The Orbit Ring is comfortable, accurate and requires a subscription to stay on your finger',
    dek: 'The $349 smart ring tracks sleep, steps and heart rate. After a 30-day trial, it also tracks whether you have paid.',
    section: 'reviews',
    image: '/placeholder/ring-paywall.webp',
    alt: 'A phone showing a paywall that reads “Your free trial of wearing has ended,” beside a gold smart ring.',
    author: 'ben-hartley',
    label: 'Review',
    credit: 'Photo illustration by Bloatberg',
    featured: false,
    hoursAgo: 40,
    body: `The Orbit Ring is the best-made smart ring I have tested. It is light, it is comfortable and its sleep tracking is more accurate than that of rings twice its price. On day 31, it began to loosen.

This is by design. The ring’s $349 price includes a 30-day trial of Orbit+, a $9.99 monthly subscription that unlocks the ring’s advanced features. Those features include sleep scores, heart-rate variability, temperature trends and, as of a firmware update in September, remaining on your hand.

“Staying on is a premium experience,” an Orbit spokesperson told me. “We believe customers who value it will be happy to pay for it.”

## Fit and finish

When subscribed, the ring is excellent. The titanium band is barely noticeable, and the battery lasted six days in my testing. The companion app is clean and does not nag, except about the subscription, which it mentions every time you open it, and sometimes when you do not.

When the subscription lapses, a small motor inside the band — which Orbit calls the Comfort Engine — widens the ring by about half a millimeter a day. By the end of my second unpaid week, it was sliding off when I washed my hands. By the third, it was on the bathroom floor, still tracking my sleep, which it rated “poor.”

${F}review
product: Orbit Ring
price: $349 + $9.99/month to keep it on
score: 4
badge: Bloat Award
verdict: A great ring, if you can keep it.
specs: Material = Titanium; Battery = 6 days; Grip = Subscription; Comfort Engine = Yes, sadly
+ Beautiful hardware
+ Accurate sleep and heart-rate tracking
+ Six-day battery
+ Very comfortable, while it lasts
- Requires $120 a year to remain a ring
- Loosens audibly
- “Grip Pack” add-on costs an extra $2.99
${F}`,
  },
  {
    slug: 'executive-humbled-post-passes-40000-words',
    title: 'Executive’s post about being humbled passes 40,000 words. He says he is “still processing.”',
    dek: 'It began with a barista spelling his name correctly. It now includes a 12-part history of his leadership philosophy and a list of his own quotes.',
    section: 'culture',
    image: '/placeholder/humbled-post.webp',
    alt: 'A social media post that begins “I’m humbled” and is cut off at “…see more.”',
    author: 'jonah-pike',
    credit: 'Illustration by Oliver Strand for Bloatberg',
    featured: false,
    hoursAgo: 44,
    body: `On Sunday morning, Grant Whitmore, the chief executive of a workplace software company called Synergly, posted to a professional networking site that he was “humbled.” As of Tuesday evening, the post was 40,212 words long, making it longer than *The Great Gatsby* and, according to Mr. Whitmore, “not done.”

The post begins with a barista correctly spelling his name on a coffee cup. By word 2,000, it has become a meditation on leadership. By word 15,000, it includes a numbered list of lessons from his first company, his second company and a sailing trip. The final section, titled “What I Would Tell My 19-Year-Old Self,” runs to 11,000 words and is addressed to an earlier version of the post.

“I sat down to write two sentences,” Mr. Whitmore said in a phone interview. “Then I realized I had a lot to be humble about.”

## “…see more”

The post has received 12,402 reactions and 3,118 comments. Most of the comments are the word “This.” Several are from Synergly employees, who said in interviews that they felt obligated to comment and had not reached the end.

${F}quote
I clicked ‘see more’ on Sunday and I am still seeing more.
— A product designer at Synergly
${F}

Readers who did reach the end reported that the last paragraph thanks the barista, whose name Mr. Whitmore does not mention.

Asked whether he planned to write a follow-up, Mr. Whitmore said he was “still processing” and was considering turning the post into a book. He added that he was humbled by the response.`,
  },
  {
    format: 'brief',
    slug: 'ai-assistant-apologizes-in-advance',
    title: 'AI assistant now apologizes for the confusion before causing it, “to save time”',
    dek: '', section: 'ai', image: '', alt: '', author: 'mara-okafor', featured: false, hoursAgo: 25,
    body: 'The update also adds “Great question!” to questions you have not asked yet.',
  },
  {
    format: 'brief',
    slug: 'good-first-issue-unsolved-six-years',
    title: 'Issue labeled “good first issue” enters sixth year unsolved by anyone, including maintainers',
    dek: '', section: 'dev', image: '', alt: '', author: 'theo-lindqvist', featured: false, hoursAgo: 33,
    body: 'Four first-time contributors have attempted it. Two have left the industry.',
  },
  {
    format: 'brief',
    slug: 'regulators-open-inquiry-into-inquiry',
    title: 'Regulators open inquiry into whether to open an inquiry',
    dek: '', section: 'policy', image: '', alt: '', author: 'celeste-moreau', featured: false, hoursAgo: 47,
    body: 'A decision is expected after a consultation on the scope of the inquiry into the inquiry.',
  },
  {
    slug: 'jensen-huang-leather-jacket-worth-more-than-countries',
    title: 'Jensen Huang’s leather jacket is now worth more than most countries, analysts say',
    dek: 'The jacket, which has appeared at every keynote in living memory, trades at a valuation analysts struggle to explain. It has no earnings. It has two sleeves.',
    section: 'visionaries',
    image: '/placeholder/jacket-ticker.webp',
    alt: 'A market terminal showing a ticker for “The Jacket,” valued at $3.1 trillion.',
    author: 'nadia-farouk',
    label: 'Analysis',
    credit: 'Illustration by The Bloatberg Graphics Desk',
    featured: false,
    hoursAgo: 31,
    body: `The black leather jacket worn by Jensen Huang, the chip industry’s most recognizable chief executive, has become one of the most valuable assets in the world, according to a Bloatberg analysis, overtaking the economies of all but a handful of nations.

The jacket, which trades informally under the symbol JKT on what analysts have started calling the Keynote Exchange, is up 214 percent this year. Its price-to-earnings ratio cannot be calculated, because it has no earnings.

“Every time it walks onstage, the market reprices everything,” said a portfolio manager at a fund that holds what it describes as “jacket-adjacent exposure.” “GPUs, data centers, power companies, cows. We don’t fully understand the mechanism. We just know not to bet against the jacket.”

## A supply problem

Demand for the jacket far outstrips supply, which is fixed at one. A waiting list for jackets of comparable stature currently stands at 14 weeks, mirroring the wait for high-end graphics processors, a correlation analysts say is “not a coincidence, probably.”

Several startups have tried to replicate the effect. One founder wore a leather jacket to a seed-round pitch and reported a 30 percent higher valuation, though the jacket was later found to be vinyl and the round was reduced accordingly.

${F}quote
The jacket is a store of value, a medium of exchange and a unit of keynote. It is the first truly accelerated garment.
— A semiconductor analyst
${F}

The jacket did not respond to a request for comment. It was, according to people familiar with its schedule, at a keynote.`,
  },
  {
    format: 'brief',
    slug: 'agi-still-a-few-thousand-days-away',
    title: 'AGI is now “a few thousand days away,” the same as it was a few thousand days ago',
    dek: '', section: 'visionaries', image: '', alt: '', author: 'mara-okafor', featured: false, hoursAgo: 20,
    body: 'Analysts said the timeline was “holding steady at imminent.”',
  },
]
