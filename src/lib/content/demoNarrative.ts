/**
 * Demo-only narrative content, used exclusively by /teams/demo.
 *
 * This is deliberately NOT the shared content library in individualProfile.ts
 * / pairwiseReport.ts — those stay PLACEHOLDER for every real customer until
 * Carey actually reviews and approves specific copy (see CLAUDE.md Section
 * 11, item 3). Filling those in here would mean every real Wood/Metal
 * profile on the platform starts showing this text, which is not what "add
 * an example to the public demo" means.
 *
 * The prose below was drafted by an AI assistant, paraphrased (not quoted)
 * from Carey Davidson's published book "The Five Archetypes" (Tiller Press,
 * 2020) — never her specific example anecdotes, needs-list wording, or
 * bullet phrasing verbatim. It has not been reviewed or approved by Carey,
 * and the demo pages that use it say so visibly. Her separate, newer
 * "Fields" framework (Blame Loop, Bridge tending, Water Doorway, Distortions)
 * is not covered by the book at all, so those sections are left out of scope
 * here too — the demo report still renders them as PLACEHOLDER, same as the
 * real product.
 *
 * Content is written generically per archetype (or per archetype pair) with
 * a name parameter interpolated at render time, so one authored entry covers
 * every person or pair in the demo team who happens to share that archetype
 * combination — the same "author once, reuse for every match" shape the real
 * content library uses, just demo-scoped.
 */

import type { Element } from "../archetypes";
import {
  INTENSITY_TIERS,
  type ContentIntensityTier,
  type IndividualProfileContent,
  type IndividualProfileContentLibrary,
} from "./individualProfile";
import type { PairwiseContent, PairKey } from "./pairwiseReport";
import { pending } from "./blocks";

/**
 * Rendered on the demo pages/PDFs above the report itself — see the file
 * header above for why this exists and what it doesn't cover.
 */
export const DEMO_NARRATIVE_DISCLAIMER =
  "Example narrative below was drafted by an AI assistant, paraphrased from Carey Davidson's " +
  "published book The Five Archetypes (Tiller Press, 2020), for demonstration only. It has not " +
  "been reviewed or approved by Carey Davidson and is not final product copy.";

const DEMO_SOURCE_REF =
  "DEMO ONLY — drafted by an AI assistant, paraphrased from Carey Davidson's The Five Archetypes (2020). Not reviewed or approved by Carey.";

function block(paragraphs: string[]) {
  return { status: "APPROVED" as const, paragraphs, sourceRef: DEMO_SOURCE_REF };
}

type IndividualTemplate = (name: string) => IndividualProfileContent;

/**
 * Per-element, per-intensity-tier narrative. "dominant" (Primary/Secondary)
 * is full-strength, direct language — this is genuinely how the person
 * operates. "moderate" (Third) is situational: present, but not their
 * default. "minor" (Fourth/Lowest) is explicitly framed as rare and
 * uncharacteristic — it should never read like a second personality. See
 * tierForRankLabel in ./individualProfile.ts for the rank → tier mapping.
 */
const INDIVIDUAL_TEMPLATES: Record<Element, Record<ContentIntensityTier, IndividualTemplate>> = {
  Wood: {
    dominant: (name) => ({
      needs: block([
        `${name} is steadied by having room to act — a real decision to make, a clear target to move toward, and enough autonomy to choose their own next step rather than wait on someone else's timetable. They do their best work when there is genuine forward motion, whether that's a project, a debate, or a challenge worth taking on, and when the people around them treat their drive as an asset rather than something to be managed.`,
        `What unsettles ${name} usually isn't conflict itself. It's friction with no clear direction, or being asked to slow down without being told why.`,
      ]),
      stressPatterns: block([
        `Under stress, ${name}'s impatience tends to compress into force: quicker to frustration when something is moving slower than it should, more likely to read a disagreement as an obstacle than as input, and prone to push a plan forward without checking whether everyone else is still on board.`,
        `Under sustained pressure, ${name} can start treating other people's caution as a challenge to their competence, when it usually isn't one.`,
      ]),
      selfCare: block([
        `The fastest way back to balance for ${name}, in the moment, is physical rather than verbal — movement discharges the charge that talking it through usually can't touch yet.`,
        `Once the edge is off, the more durable fix is a regular, deliberate pause: a standing check-in, or simply asking "what's the next right step" out loud instead of just moving, so their forward motion doesn't outrun everyone else's ability to keep up.`,
      ]),
    }),
    moderate: (name) => ({
      needs: block([
        `Wood isn't ${name}'s default lens, but it sits close enough to the surface that a real decision or a clear target still noticeably steadies them — just not as constantly as it would for someone leading with it. They tend to reach for it when a situation genuinely calls for forward motion, rather than bringing it to everything.`,
      ]),
      stressPatterns: block([
        `Under real pressure, ${name} can show a flash of Wood-style impatience — pushing to move faster, or reading a delay as an obstacle — but it tends to surface situationally rather than being their go-to stress reaction.`,
      ]),
      selfCare: block([
        `When this does show up, a short burst of physical movement or a concrete next step tends to settle it quickly for ${name}, though it's rarely the first thing they need.`,
      ]),
    }),
    minor: (name) => ({
      needs: block([
        `Wood is one of ${name}'s least-accessed lenses, so having room to act on their own timetable isn't something they naturally need or reach for — decisiveness and forward motion are more likely to come from someone else in the room.`,
      ]),
      stressPatterns: block([
        `This isn't how ${name} typically reacts under stress. On the rare occasion sustained pressure pushes them into it, it can look like an uncharacteristic flash of impatience or bluntness — worth noticing precisely because it's so unlike them, not their normal stress signature.`,
      ]),
      selfCare: block([
        `Since this isn't ${name}'s natural territory, deliberately borrowing from it — making a call rather than waiting, choosing a next step instead of gathering more input — is more useful as an occasional stretch than a self-care habit.`,
      ]),
    }),
  },
  Fire: {
    dominant: (name) => ({
      needs: block([
        `${name} is steadied by warmth and things to look forward to — genuine two-way connection, room for playfulness, and permission to feel and express emotion openly rather than keep it contained. They do their best work in an environment charged with possibility and real human contact, where enthusiasm is met rather than quietly dampened.`,
        `What unsettles ${name} isn't seriousness itself. It's isolation, being overlooked, or having their optimism read as naivety.`,
      ]),
      stressPatterns: block([
        `Under stress, ${name} tends to scatter: harder to focus or hold on to details, quicker to swing between moods, and prone to over-commit in the hope that saying yes keeps the good feeling going.`,
        `Sustained pressure can tip into a restlessness or anxiety that looks, from the outside, more like distraction than distress.`,
      ]),
      selfCare: block([
        `The fastest way back to balance for ${name} in the moment is genuine human contact — being heard, reassured, and reminded that people still have their back.`,
        `Once that initial wave passes, the more durable fix is building in real rest and unstructured downtime, so their enthusiasm has room to recover instead of running at full charge indefinitely.`,
      ]),
    }),
    moderate: (name) => ({
      needs: block([
        `Fire isn't the lens ${name} leads with, but warmth and connection still noticeably lift them when a situation offers it — they're just not actively seeking it out the way someone leading with Fire would.`,
      ]),
      stressPatterns: block([
        `Under real pressure, ${name} can show flashes of Fire's scatter — harder to focus, quicker to over-commit — but it tends to surface situationally, in specific moments, rather than being their default stress pattern.`,
      ]),
      selfCare: block([
        `When it does show up, a bit of genuine connection or a lighter moment tends to settle ${name} quickly, though it's not usually the first thing they reach for.`,
      ]),
    }),
    minor: (name) => ({
      needs: block([
        `Fire is one of ${name}'s least-accessed lenses, so warmth-seeking and open emotional expression aren't things they naturally need from a room — connection is more likely to come to them through someone else's initiative than their own.`,
      ]),
      stressPatterns: block([
        `This isn't how ${name} typically reacts under stress. On the rare occasion sustained pressure pushes them into it, it can look like an uncharacteristic burst of scatter or over-commitment — notable mainly because it's so unlike their usual pattern.`,
      ]),
      selfCare: block([
        `Since this isn't ${name}'s natural territory, deliberately borrowing from it — allowing more open enthusiasm, leaning into connection rather than holding back — is more useful as an occasional stretch than a regular self-care habit.`,
      ]),
    }),
  },
  Earth: {
    dominant: (name) => ({
      needs: block([
        `${name} is steadied by belonging and being genuinely needed — a settled place in the group, regular contact, and the sense that their care for others is actually landing rather than going unnoticed. They do their best work collaboratively, with time built in to check on people and be checked on themselves.`,
        `What unsettles ${name} is exclusion, or the feeling that they are the only one holding a relationship or a project together.`,
      ]),
      stressPatterns: block([
        `Under stress, ${name} tends to turn inward as worry: overthinking whether they're doing enough for everyone else, struggling to say no, and losing confidence in their own judgment.`,
        `Sustained pressure can leave them circling a decision rather than acting on it, since acting risks disappointing someone.`,
      ]),
      selfCare: block([
        `The fastest way back to balance for ${name} in the moment is reassurance paired with a concrete next step — confirmation that they haven't let anyone down, plus something specific to do about it.`,
        `The more durable fix is practising small, low-stakes "no"s regularly, so it doesn't take a crisis for a real boundary to finally come out.`,
      ]),
    }),
    moderate: (name) => ({
      needs: block([
        `Earth isn't ${name}'s default lens, but belonging and being useful to the people around them still noticeably steady them when a situation calls for it — just not as the constant undertone it would be for someone leading with it.`,
      ]),
      stressPatterns: block([
        `Under real pressure, ${name} can show flashes of Earth's people-pleasing pull — worrying whether they're doing enough for others, hesitating to say no — but it tends to show up situationally rather than as their default reaction.`,
      ]),
      selfCare: block([
        `When it does show up, a bit of direct reassurance plus something concrete to act on tends to settle it for ${name} fairly quickly, though it's not usually what they need first.`,
      ]),
    }),
    minor: (name) => ({
      needs: block([
        `Earth is one of ${name}'s least-accessed lenses, so being needed and checked on isn't something they naturally chase — belonging is more likely to be something they extend to others than something they require for themselves.`,
      ]),
      stressPatterns: block([
        `This isn't how ${name} typically reacts under stress. On the rare occasion sustained pressure pushes them into it, it can look like an uncharacteristic bout of people-pleasing or indecision — notable mainly for how unlike their usual pattern it is.`,
      ]),
      selfCare: block([
        `Since this isn't ${name}'s natural territory, deliberately borrowing from it — checking in on how a decision lands for others, practising visible care — is more useful as an occasional stretch than a regular self-care habit.`,
      ]),
    }),
  },
  Metal: {
    dominant: (name) => ({
      needs: block([
        `${name} is steadied by clearly defined expectations, consistent process, and time to get something right before it's judged. They do their best work when standards are explicit rather than assumed, and when their attention to detail is recognised as care rather than fussiness.`,
        `What unsettles ${name} is ambiguity about what "good" looks like, and being rushed past a check they consider necessary.`,
      ]),
      stressPatterns: block([
        `${name}'s stress tends to show up as narrowing focus: over-attending to small details at the expense of the bigger picture, becoming more critical of themselves and others, and taking it personally when standards or agreed process aren't followed.`,
        `Under sustained pressure, ${name} can get stuck relitigating what already went wrong rather than moving on to what's next.`,
      ]),
      selfCare: block([
        `The fastest way back to balance for ${name} in the moment is to physically step back from the details that have taken over — a short break, away from the screen, before returning to the work.`,
        `The more durable fix is protected time to do things properly the first time, so quality doesn't have to be defended after the fact.`,
      ]),
    }),
    moderate: (name) => ({
      needs: block([
        `Metal isn't ${name}'s default lens, but clear standards and a chance to get something right still noticeably steady them when the situation calls for precision — just not as a constant requirement the way it would be for someone leading with it.`,
      ]),
      stressPatterns: block([
        `Under real pressure, ${name} can show flashes of Metal's narrowing focus — getting caught up in details, more critical than usual — but it tends to surface situationally rather than being their go-to stress reaction.`,
      ]),
      selfCare: block([
        `When it does show up, a short step back from the details tends to settle it for ${name} fairly quickly, though it's rarely the first thing they need.`,
      ]),
    }),
    minor: (name) => ({
      needs: block([
        `Metal is one of ${name}'s least-accessed lenses, so explicit standards and process aren't something they naturally require to feel steady — precision is more likely to come from someone else in the room than from their own default setting.`,
      ]),
      stressPatterns: block([
        `This isn't how ${name} typically reacts under stress. On the rare occasion sustained pressure pushes them into it, it can look like an uncharacteristic bout of nitpicking or rigidity — notable mainly for how unlike their usual pattern it is.`,
      ]),
      selfCare: block([
        `Since this isn't ${name}'s natural territory, deliberately borrowing from it — setting an explicit standard, checking a detail before moving on — is more useful as an occasional stretch than a regular self-care habit.`,
      ]),
    }),
  },
  Water: {
    dominant: (name) => ({
      needs: block([
        `${name} is steadied by quiet, unstructured time to think something all the way through before committing to it. They do their best work alone or in low-noise settings, with enough runway to reach their own conclusions rather than being rushed to a verdict.`,
        `What unsettles ${name} is being pressed for an instant answer, or having their need for space mistaken for disinterest.`,
      ]),
      stressPatterns: block([
        `Under stress, ${name} tends to withdraw further than usual: harder to reach, slower to respond, and more likely to sit with a problem indefinitely rather than act on a decision they haven't fully turned over.`,
        `Sustained pressure can tip into an isolation that looks, from the outside, more like disengagement than overload.`,
      ]),
      selfCare: block([
        `The fastest way back to balance for ${name} in the moment is a concrete small step or physical movement, since sitting alone with the problem can extend the stall rather than resolve it.`,
        `The more durable fix is scheduling real, protected thinking time in advance, so solitude is a planned resource rather than something only reached for once withdrawal has already set in.`,
      ]),
    }),
    moderate: (name) => ({
      needs: block([
        `Water isn't ${name}'s default lens, but quiet thinking time still noticeably steadies them when a situation genuinely calls for it — just not as a constant requirement the way it would be for someone leading with it.`,
      ]),
      stressPatterns: block([
        `Under real pressure, ${name} can show flashes of Water's withdrawal — going quieter, slower to respond — but it tends to surface situationally rather than being their go-to stress reaction.`,
      ]),
      selfCare: block([
        `When it does show up, a bit of real, protected thinking time tends to settle it for ${name} fairly quickly, though it's rarely the first thing they need.`,
      ]),
    }),
    minor: (name) => ({
      needs: block([
        `Water is one of ${name}'s least-accessed lenses, so quiet, unstructured thinking time isn't something they naturally seek out to feel steady — reflection is more likely to happen for them in the middle of doing something than as protected time set apart from it.`,
      ]),
      stressPatterns: block([
        `This isn't how ${name} typically reacts under stress — withdrawal and going quiet are not their normal stress signature. On the rare occasion sustained pressure pushes them into it, it's likely to look like an uncharacteristic quietness rather than the deliberate reflection Water represents at full strength, and it's worth noticing precisely because it's so unlike them.`,
      ]),
      selfCare: block([
        `Since this isn't ${name}'s natural territory, deliberately borrowing from it — building in a bit of quiet, unhurried thinking time before deciding — is more useful as an occasional stretch than a regular self-care habit.`,
      ]),
    }),
  },
};

/** First name only — reads naturally when repeated through several paragraphs. */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function buildDemoIndividualContent(fullName: string): IndividualProfileContentLibrary {
  const name = firstNameOf(fullName);
  const elements = Object.keys(INDIVIDUAL_TEMPLATES) as Element[];
  return Object.fromEntries(
    elements.map((element) => [
      element,
      Object.fromEntries(
        INTENSITY_TIERS.map((tier) => [tier, INDIVIDUAL_TEMPLATES[element][tier](name)])
      ),
    ])
  ) as IndividualProfileContentLibrary;
}

export const DEMO_INDIVIDUAL_FRAMING = {
  structural: {
    howToRead:
      "Your five element scores are listed from highest to lowest. The highest is your primary archetype; the lowest points at where you have the most room to grow.",
    scoreNote:
      "Scores come from your assessment exactly as it reported them. They are a snapshot of how you answered, not a fixed measure of who you are.",
  },
  introduction: block([
    "Everyone carries all five elements; what varies is the order they rank in for you. This report reads your scores from highest to lowest and describes what that ordering tends to mean day to day, at work and under pressure.",
  ]),
  primaryArchetype: block([
    "Your highest-scoring element is your primary archetype. It's the lens you default to first when deciding how to act, and the one most likely to show up, in both its strong and its stressed form, when something matters to you.",
  ]),
  lowestArchetype: block([
    "Your lowest-scoring element isn't a weakness to fix so much as a set of skills you reach for less naturally. Deliberately borrowing from it, especially under stress, tends to open options your primary archetype alone wouldn't reach for.",
  ]),
  // The book has no equivalent concept, and CLAUDE.md flags the platform's
  // element-based sequencing mapping itself as unconfirmed with Carey — so
  // this stays a placeholder even in the demo.
  sequencing: pending("explanation of the sequencing roles"),
  closing: block([
    "None of this is a verdict. It's a description of tendencies under specific conditions, useful for noticing patterns sooner and choosing, deliberately, how to respond to them.",
  ]),
};

type PairwiseTemplate = (nameA: string, nameB: string) => Omit<PairwiseContent, never>;

const PAIRWISE_TEMPLATES: Record<PairKey, PairwiseTemplate> = {
  "Wood+Wood": (A, B) => ({
    coreDynamic: block([
      `${A} and ${B} both lead with Wood, so they tend to move at a similar pace and rarely have to convince each other that speed and forward motion matter. At their best they reinforce each other's drive; at their worst they can double down on the same blind spots at once, since neither one naturally pumps the brakes.`,
    ]),
    inPractice: block([
      `Meetings between ${A} and ${B} tend to move fast and reach decisions quickly, which is a strength when the decision is right and a liability when it isn't, since neither is inclined to slow the other down to check.`,
    ]),
    scoreImpact: block([
      `The closer their two Wood scores sit, the more this shared-momentum pattern dominates; a real gap on any other element becomes the more useful thing to watch, since it's where one of them will naturally supply what the other is missing.`,
    ]),
    escalationLoop: block([
      `Under pressure, both ${A} and ${B} tend to push harder rather than pause, so disagreements between them can escalate quickly, each one reading the other's insistence as competition rather than collaboration.`,
    ]),
    risks: block([
      `Without something to check their shared pace, ${A} and ${B} risk moving a project forward too fast for its own foundations, and risk turning ordinary disagreements into contests neither wants to lose.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree in advance on who has final call on which kinds of decisions, and to deliberately borrow a slower, detail-oriented lens before locking something in, rather than relying on each other to provide it.`,
    ]),
    directScript: block([
      `For either of them: "I don't want to slow this down, I want to get it right — can we take two minutes to check this before we move?"`,
    ]),
  }),
  "Fire+Fire": (A, B) => ({
    coreDynamic: block([
      `${A} and ${B} both lead with Fire, so warmth and enthusiasm come easily between them, but with nobody in the pairing naturally holding steady, hard news or necessary criticism can get avoided by both sides at once.`,
    ]),
    inPractice: block([
      `Conversations between ${A} and ${B} tend to be upbeat and quick to build momentum, though follow-through on the less enjoyable parts of a plan can lag if neither one steps into that role.`,
    ]),
    scoreImpact: block([
      `The closer their Fire scores, the more this mutual-avoidance pattern shows up around genuinely difficult topics; a real gap on Metal or Earth specifically means one of them has more capacity to hold the group accountable when it's needed.`,
    ]),
    escalationLoop: block([
      `When something goes wrong, ${A} and ${B} can both default to reassurance rather than diagnosis, which delays the harder conversation until the problem is bigger than it needed to be.`,
    ]),
    risks: block([
      `Left unaddressed, this pairing risks avoiding necessary friction for too long, and risks both people over-committing to more than either can actually deliver.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} benefit from naming, out loud, when a conversation needs to get serious rather than staying pleasant, and from building in a specific point where they check progress against reality rather than vibes.`,
    ]),
    directScript: block([
      `For either of them: "I want to stay positive about this, and I also need us to look honestly at whether it's actually working."`,
    ]),
  }),
  "Earth+Earth": (A, B) => ({
    coreDynamic: block([
      `${A} and ${B} both lead with Earth, so mutual support comes naturally, but with both people oriented toward pleasing rather than deciding, the pairing can struggle to make a call that might disappoint someone.`,
    ]),
    inPractice: block([
      `${A} and ${B} tend to over-consult each other and the wider team before committing to anything, which builds strong buy-in but can slow decisions that don't actually need a consensus.`,
    ]),
    scoreImpact: block([
      `The closer their Earth scores, the more decisions stall in the collaborative stage; a real gap on Wood or Metal specifically means one of them has more capacity to actually close a decision out once it's been discussed enough.`,
    ]),
    escalationLoop: block([
      `When a decision is overdue, both ${A} and ${B} can keep gathering more input rather than choosing, each waiting for the other to take the risk of deciding first.`,
    ]),
    risks: block([
      `Left unaddressed, this pairing risks chronic indecision, and risks both people quietly overextending themselves to avoid letting anyone down.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to set a firm deadline for when a decision gets made regardless of remaining uncertainty, and to explicitly give each other permission to say no without it being read as a letdown.`,
    ]),
    directScript: block([
      `For either of them: "I think we have enough to decide — can we commit to this today rather than checking in with anyone else first?"`,
    ]),
  }),
  "Metal+Metal": (A, B) => ({
    coreDynamic: block([
      `${A} and ${B} both lead with Metal, so shared standards and follow-through come easily, but with nobody naturally pushing for speed, the pairing can spend longer refining something than the situation actually calls for.`,
    ]),
    inPractice: block([
      `${A} and ${B} tend to agree quickly on what "good" looks like, and just as quickly on where something falls short of it, which keeps quality high but can turn small imperfections into bigger sticking points than they deserve.`,
    ]),
    scoreImpact: block([
      `The closer their Metal scores, the more this shared perfectionism shows up; a real gap on Wood or Fire specifically means one of them has more capacity to say "this is good enough, ship it" when the other can't.`,
    ]),
    escalationLoop: block([
      `Under pressure, both ${A} and ${B} can dig into details rather than step back, each one's critique reinforcing the other's, until a minor issue has absorbed disproportionate attention.`,
    ]),
    risks: block([
      `Left unaddressed, this pairing risks missing deadlines in service of polish nobody outside the pairing asked for, and risks both people becoming quietly resentful over whose standard is "the real" one.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree on a "good enough" threshold for a given piece of work before starting on it, and to timebox review rounds rather than letting them run open-ended.`,
    ]),
    directScript: block([
      `For either of them: "I know this isn't perfect yet — is it good enough to move on, or is there one specific thing left that actually matters?"`,
    ]),
  }),
  "Water+Water": (A, B) => ({
    coreDynamic: block([
      `${A} and ${B} both lead with Water, so neither pushes the other to decide before they're ready, which respects each other's process but can leave a decision drifting longer than the situation allows.`,
    ]),
    inPractice: block([
      `${A} and ${B} tend to give each other space rather than chase for an answer, which works well for genuinely complex problems and less well for ordinary ones that just need a call made.`,
    ]),
    scoreImpact: block([
      `The closer their Water scores, the more decisions drift; a real gap on Wood or Fire specifically means one of them has more capacity to inject urgency and actually move things along when needed.`,
    ]),
    escalationLoop: block([
      `Under pressure, both ${A} and ${B} tend to withdraw rather than engage, so a stalled decision between them can quietly go unaddressed by either side, each waiting for the other to raise it first.`,
    ]),
    risks: block([
      `Left unaddressed, this pairing risks letting genuinely time-sensitive decisions slip past their window, and risks both people becoming harder to reach right when the other most needs them to engage.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to set an explicit check-in date for anything left open, since neither will naturally chase the other for one, and to agree that "still thinking" needs a deadline attached.`,
    ]),
    directScript: block([
      `For either of them: "I know we both want more time on this — can we agree on exactly when we'll decide, even if neither of us feels fully ready?"`,
    ]),
  }),
  "Wood+Fire": (A, B) => ({
    coreDynamic: block([
      `Wood's forward drive and Fire's warmth reinforce each other naturally: ${A}'s momentum gives ${B} something exciting to rally around, and ${B}'s enthusiasm makes ${A}'s push feel like an invitation rather than a demand.`,
    ]),
    inPractice: block([
      `${A} tends to set the direction and ${B} tends to bring the room along with it, which works well for launching new initiatives and building buy-in quickly.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Wood and Fire scores respectively, the more clearly this division of labour shows up: one supplying direction, the other supplying morale.`,
    ]),
    escalationLoop: block([
      `Under stress, ${A}'s impatience can start to read as dismissive of ${B}'s need for connection, and ${B}'s need to keep things upbeat can start to read to ${A} as avoiding a hard truth.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} risks steamrolling past ${B}'s concerns in the name of speed, and ${B} risks papering over real problems to keep the mood positive.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to explicitly check in on morale before pushing pace further, and to agree that enthusiasm doesn't mean a concern has been resolved.`,
    ]),
    directScript: block([
      `For ${A}: "I want to keep moving, and I want to hear if this is landing badly first." For ${B}: "I'm on board, and there's something real I need to flag before we go further."`,
    ]),
  }),
  "Fire+Earth": (A, B) => ({
    coreDynamic: block([
      `Fire's warmth and Earth's steadiness reinforce each other well: ${A}'s energy makes people want to engage, and ${B}'s consistency makes sure that engagement turns into something durable.`,
    ]),
    inPractice: block([
      `${A} tends to spark enthusiasm for an idea, and ${B} tends to be the one who quietly makes sure everyone stays included and the follow-through actually happens.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Fire and Earth scores respectively, the more this pattern shows up as ${A} generating energy that ${B} has to convert into sustained commitment.`,
    ]),
    escalationLoop: block([
      `Under stress, ${A} can become scattered and inconsistent, which leaves ${B} quietly carrying more of the caretaking load than either of them intended, and starting to feel taken for granted.`,
    ]),
    risks: block([
      `Left unaddressed, ${B} risks burning out from invisible over-functioning, and ${A} risks not noticing until the relationship or the project has already been strained.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to make ${B}'s contribution explicit rather than assumed, and for ${A} to regularly ask what ${B} actually needs rather than assuming their steadiness means everything's fine.`,
    ]),
    directScript: block([
      `For ${A}: "I know you've been holding a lot together — what do you actually need from me?" For ${B}: "I've been picking up more than I've said out loud, and I need that acknowledged."`,
    ]),
  }),
  "Earth+Metal": (A, B) => ({
    coreDynamic: block([
      `Earth's care for people and Metal's care for quality reinforce each other: ${A} makes sure everyone feels included, and ${B} makes sure the work itself holds up to scrutiny.`,
    ]),
    inPractice: block([
      `${A} tends to smooth the human side of a project, and ${B} tends to hold the line on standards and process, which together produce work that's both well-received and well-made.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Earth and Metal scores respectively, the more clearly this split shows up: one managing the relationships, the other managing the rigour.`,
    ]),
    escalationLoop: block([
      `Under stress, ${B}'s standards can start to feel, to ${A}, like criticism of the people involved rather than the work, and ${A}'s desire to smooth things over can start to feel, to ${B}, like standards being quietly lowered.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} risks absorbing blame that belongs to a process issue, and ${B} risks being seen as harsh when the intent was precision.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to separate feedback on the work from feedback on the person explicitly, out loud, so ${B}'s standards don't land as a judgment ${A} then has to manage.`,
    ]),
    directScript: block([
      `For ${A}: "I hear this as a process fix, not a dig at anyone — is that how you meant it?" For ${B}: "This is about the work, not the person — I want to be clear about that."`,
    ]),
  }),
  "Metal+Water": (A, B) => ({
    coreDynamic: block([
      `Metal's structure and Water's depth reinforce each other: ${A}'s standards give ${B}'s reflection somewhere concrete to land, and ${B}'s thoroughness gives ${A} confidence the process was actually right, not just followed.`,
    ]),
    inPractice: block([
      `${A} tends to define what "done properly" looks like, and ${B} tends to be the one willing to sit with a genuinely hard problem until the right answer, not just an answer, emerges.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Metal and Water scores respectively, the more this shows up as ${A} pushing for defined process while ${B} pushes for enough time to actually think it through.`,
    ]),
    escalationLoop: block([
      `Under stress, ${A}'s need for a defined process can start to feel, to ${B}, like being rushed past genuine reflection, and ${B}'s need for more time can start to feel, to ${A}, like the process isn't being respected.`,
    ]),
    risks: block([
      `Left unaddressed, ${B} risks being pushed into a decision before they've actually reached clarity, and ${A} risks watching a deadline slip while waiting on reflection that has no defined endpoint.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree on a firm but generous deadline for reflection up front, so ${B} gets real thinking time and ${A} still gets a process with an end date.`,
    ]),
    directScript: block([
      `For ${A}: "How much time do you actually need to get to a real answer here, not just any answer?" For ${B}: "I need a bit more time before this is genuinely ready — here's when I'll have it."`,
    ]),
  }),
  "Wood+Water": (A, B) => ({
    coreDynamic: block([
      `Wood's drive and Water's depth reinforce each other over time: ${A}'s push turns ${B}'s ideas into action, and ${B}'s reflection gives ${A}'s momentum somewhere considered to go.`,
    ]),
    inPractice: block([
      `${A} tends to be the one who gets things moving, and ${B} tends to be the one who's already thought several steps further ahead, a combination that works well once each trusts the other's timing.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Wood and Water scores respectively, the more likely ${A} feels held back by ${B}'s pace, or ${B} feels rushed past by ${A}'s.`,
    ]),
    escalationLoop: block([
      `Under stress, ${A}'s push for speed can read, to ${B}, as a demand to skip the reflection that actually produces the good ideas, and ${B}'s need for space can read, to ${A}, as stalling.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} risks acting on an idea before ${B} has actually finished thinking it through, and ${B} risks withdrawing from a partnership that never seems to wait for them.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree on a specific, bounded amount of thinking time up front, so ${B} isn't rushed and ${A} isn't left waiting indefinitely.`,
    ]),
    directScript: block([
      `For ${A}: "I want to move soon — how much time do you need to feel good about this first?" For ${B}: "I need a bit longer before I'm confident — here's exactly when I'll be ready."`,
    ]),
  }),
  "Wood+Earth": (A, B) => ({
    coreDynamic: block([
      `Wood pushes for progress; Earth pushes for consensus and care. Paired together, ${A} supplies direction and ${B} supplies buy-in — at their best, one moves the group forward while the other makes sure nobody's left behind. At their worst, ${A} reads ${B}'s caution as foot-dragging, and ${B} reads ${A}'s pace as steamrolling the people involved.`,
    ]),
    inPractice: block([
      `Day to day, ${A} wants to make the call and move on, while ${B} wants to check in with everyone affected first. Meetings are the clearest tell: ${A} wants an outcome, ${B} wants everyone heard.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Wood scores specifically, the more this shows up as a pace mismatch; a narrower gap on Earth means both are more comfortable making a call without full consensus than a typical Wood-Earth pair.`,
    ]),
    escalationLoop: block([
      `It tends to start small: ${A} pushes to close something out, ${B} asks to check with the team first. ${A}, reading this as delay, pushes harder or moves without full buy-in; ${B}, feeling overridden, quietly absorbs the discomfort rather than raising it directly, and starts feeling less invested.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} starts treating ${B}'s consultation as an obstacle rather than genuine care for the team, which erodes trust; ${B} starts feeling unheard and disengages rather than pushing back, which looks to ${A} like agreement when it isn't.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree in advance on which decisions genuinely need full buy-in and which are fine to make quickly, so neither has to guess which mode they're in.`,
    ]),
    directScript: block([
      `For ${A}: "I want to move on this — who specifically needs to weigh in before I do?" For ${B}: "I'm not blocking this — I just need us to check with the team first, and here's how long that'll take."`,
    ]),
  }),
  "Earth+Water": (A, B) => ({
    coreDynamic: block([
      `Earth pushes for connection and togetherness; Water pushes for solitude and reflection. Paired together, ${A} supplies warmth and ${B} supplies depth — at their best, one keeps the relationship close while the other brings real insight to it. At their worst, ${A} reads ${B}'s need for space as rejection, and ${B} reads ${A}'s need for closeness as intrusive.`,
    ]),
    inPractice: block([
      `${A} tends to want regular check-ins and shared time; ${B} tends to want to be left alone to think and will surface only once they've reached a conclusion.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Earth scores specifically, the more ${A} feels shut out; the wider the gap on Water, the more ${B} feels crowded.`,
    ]),
    escalationLoop: block([
      `It tends to start small: ${B} withdraws to think, ${A} reaches out to reconnect. ${B}, feeling crowded, withdraws further; ${A}, feeling shut out, reaches out more insistently, each response intensifying the other's.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} risks feeling permanently rejected by a pattern that isn't personal, and ${B} risks feeling permanently crowded by care that isn't meant to intrude.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree in advance on a signal for "I need space right now, not forever" so ${A} isn't left guessing and ${B} isn't chased mid-thought.`,
    ]),
    directScript: block([
      `For ${A}: "I want to check in — tell me if now's a good time or if you need more space first." For ${B}: "I need some time alone with this, and I'll come find you once I've got somewhere."`,
    ]),
  }),
  "Fire+Water": (A, B) => ({
    coreDynamic: block([
      `Fire pushes for connection and expression; Water pushes for solitude and reflection. Paired together, ${A} supplies warmth and ${B} supplies depth — at their best, one brings energy and the other brings substance. At their worst, ${A} reads ${B}'s reserve as coldness, and ${B} reads ${A}'s enthusiasm as overwhelming.`,
    ]),
    inPractice: block([
      `${A} tends to want to talk something through out loud, in the moment; ${B} tends to want to sit with it privately before saying anything at all.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Fire scores specifically, the more ${A} feels ${B} is holding back; the wider the gap on Water, the more ${B} feels rushed to respond before they're ready.`,
    ]),
    escalationLoop: block([
      `It tends to start small: ${A} shares something with energy, ${B} responds with measured reserve. ${A}, reading this as disinterest, pushes for more reaction; ${B}, feeling crowded, retreats further, each response confirming the other's worst read.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} risks feeling perpetually unheard, and ${B} risks feeling perpetually overwhelmed, with neither actually getting what they need from the other.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree that a measured response isn't a lack of care, and that enthusiasm isn't a demand for an instant answer, and to build in a short delay before ${B} needs to respond.`,
    ]),
    directScript: block([
      `For ${A}: "I don't need an answer right now — take the time you need." For ${B}: "I care about this, I just need a bit before I can respond properly."`,
    ]),
  }),
  "Fire+Metal": (A, B) => ({
    coreDynamic: block([
      `Fire pushes for spontaneity and warmth; Metal pushes for structure and precision. Paired together, ${A} supplies energy and ${B} supplies rigour — at their best, one keeps things human while the other keeps them accurate. At their worst, ${A} reads ${B}'s standards as joyless, and ${B} reads ${A}'s spontaneity as careless.`,
    ]),
    inPractice: block([
      `${A} tends to want to jump in and see what happens; ${B} tends to want a plan and a defined process before anything starts.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Fire scores specifically, the more ${B} feels ${A} is undisciplined; the wider the gap on Metal, the more ${A} feels ${B} is joyless.`,
    ]),
    escalationLoop: block([
      `It tends to start small: ${A} improvises past a step, ${B} flags the deviation. ${A}, reading this as nitpicking, improvises more to prove it's fine; ${B}, feeling ignored, tightens the process further, each response reinforcing the other's frustration.`,
    ]),
    risks: block([
      `Left unaddressed, ${B} starts treating ${A} as unreliable, and ${A} starts treating ${B} as an obstacle to enjoying the work, and both stop assuming good faith from the other.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree in advance on which parts of a project need a fixed process and which can stay loose, so neither is constantly negotiating the other's default mode.`,
    ]),
    directScript: block([
      `For ${A}: "I know this bit needs to be precise — I'll follow the process here." For ${B}: "This part can stay loose — go have fun with it."`,
    ]),
  }),
  "Wood+Metal": (A, B) => ({
    coreDynamic: block([
      `Wood moves first and settles details later; Metal settles details first and moves once they're right. Paired together, ${A} supplies momentum and ${B} supplies precision — at their best, one keeps the work moving while the other keeps it from shipping broken. At their worst, ${A} reads ${B}'s caution as foot-dragging, and ${B} reads ${A}'s pace as carelessness.`,
    ]),
    inPractice: block([
      `Day to day this shows up in meetings and deadlines: ${A} wants a decision by the end of the conversation, ${B} wants the agenda followed and the open items properly closed out.`,
    ]),
    scoreImpact: block([
      `The wider the gap between their Wood scores specifically, the more this shows up as a tempo mismatch; a narrower gap on Metal means both are more forgiving of loose ends than a typical Wood-Metal pair.`,
    ]),
    escalationLoop: block([
      `It tends to start small: ${A} pushes to close something out, ${B} asks for one more check. ${A}, reading this as delay, pushes harder or moves without full buy-in; ${B}, feeling overridden, digs into the details even further.`,
    ]),
    risks: block([
      `Left unaddressed, ${A} starts treating ${B}'s standards as an obstacle to route around, and ${B} starts double-checking ${A}'s work without saying so — both risk deciding the other is the problem.`,
    ]),
    calibrationTools: block([
      `${A} and ${B} do well to agree in advance which decisions genuinely need ${B}'s full review and which are fine for ${A} to make at their own speed.`,
    ]),
    directScript: block([
      `For ${A}: "I want to move on this today — what's the one thing you need checked first?" For ${B}: "I'm not blocking this — give me thirty minutes to check one thing, then it's yours."`,
    ]),
  }),
};

export function buildDemoPairwiseContent(key: PairKey, fullNameA: string, fullNameB: string): PairwiseContent {
  const template = PAIRWISE_TEMPLATES[key];
  return template(firstNameOf(fullNameA), firstNameOf(fullNameB));
}

export const DEMO_PAIRWISE_FRAMING = {
  structural: {
    howToRead:
      "This report describes a working relationship, not a verdict on either person. It pairs what is generally true of these two archetypes with what these two particular sets of scores change about it.",
    fieldNote:
      "Both people shape the space between them, so either one can change the dynamic without waiting for the other.",
    frictionNote:
      "Friction between two archetypes is information about the pairing, not a fault in either person.",
  },
  introduction: block([
    "This report describes a working relationship between two specific people's scores, not a verdict on either of them. The pattern below is general to anyone leading with these two archetypes; the score comparisons further down are specific to this pair.",
  ]),
  // Carey's "Fields" framework (Blame Loop, Bridge, Water Doorway,
  // Distortions) is not in the book at all, so there's no source material to
  // draft this from — stays a placeholder even in the demo.
  fieldExplainer: pending("what the Field is, for a workplace audience"),
  closing: block([
    "Either person can shift this dynamic without waiting for the other to go first. Noticing the loop earlier is most of the work.",
  ]),
};
