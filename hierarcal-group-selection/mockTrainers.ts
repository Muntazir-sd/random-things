import { IDashboardTrainer } from '@/utils/makeHierarchicalTrainerOptions/types';

const TOTAL = 400;
const BROKEN_PROBABILITY = 0.02; // Small % broken to test orphan handling

/**
 * Helper to generate a random integer between min and max (inclusive).
 */
const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Helper to pick a random element from an array.
 */
const pick = <T>(arr: T[]) => arr[random(0, arr.length - 1)];

const firstNames = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Vihaan',
  'Arjun',
  'Sai',
  'Reyansh',
  'Krishna',
  'Ishaan',
  'Shaurya',
  'Ayaan',
  'Kabir',
  'Atharv',
  'Rudra',
  'Dhruv',
  'Aryan',
  'Dev',
  'Kunal',
  'Rahul',
  'Manav',
  'Rohan',
  'Nikhil',
  'Harsh',
  'Varun',
  'Ananya',
  'Diya',
  'Saanvi',
  'Myra',
  'Aadhya',
  'Riya',
  'Meera',
  'Tara',
  'Kiara',
  'Ira',
  'Zoya',
  'Alina',
  'Fatima',
  'Noor',
  'Aisha',
  'Sara',
  'Lavanya',
  'Pooja',
  'Sneha',
  'Tanvi',
  'Simran',
  'Shreya',
  'Ishita',
  'Naina',
  'Yash',
  'Pranav',
  'Om',
  'Tejas',
  'Karthik',
  'Arpit',
  'Mohit',
  'Siddharth',
];

const lastNames = [
  'Sharma',
  'Verma',
  'Mehta',
  'Kapoor',
  'Reddy',
  'Nair',
  'Patel',
  'Khan',
  'Singh',
  'Jain',
  'Malhotra',
  'Chopra',
  'Desai',
  'Bansal',
  'Agarwal',
  'Menon',
  'Chaudhary',
  'Joshi',
  'Iyer',
  'Pandey',
  'Sheikh',
  'Thomas',
  'D’Souza',
  'Gupta',
  'Yadav',
  'Kulkarni',
  'Tripathi',
  'Bhattacharya',
  'Rastogi',
  'Tiwari',
  'Saxena',
  'Arora',
  'Mishra',
  'Naidu',
  'Pillai',
  'Ghosh',
  'Roy',
  'Das',
  'Srivastava',
  'Chatterjee',
];

const trainers: IDashboardTrainer[] = [];

/**
 * Generate Root Nodes (Level 1).
 * Ensure stable entry points for tree rendering.
 * Without root nodes, some children may never attach if generated randomly.
 */
for (let i = 1; i <= 5; i++) {
  trainers.push({
    trainer_id: i,
    trainer_name: `${pick(firstNames)} ${pick(lastNames)}`,
    reporting_to: null,
    level: 1,
  });
}

/**
 * Generate Children Nodes (Levels 1-6).
 * Simulates a realistic organization with occasional data integrity issues (orphans).
 */
for (let i = 6; i <= TOTAL; i++) {
  const level = random(1, 6);
  let reportingTo: number | null = null;

  const shouldBreak =
    (level === 2 || level === 3) && Math.random() < BROKEN_PROBABILITY;

  if (level > 1 && !shouldBreak) {
    // Parent must already exist and be lower level (e.g. Lvl 3 reports to Lvl 2 or 1)
    const possibleParents = trainers.filter((t) => t.level < level);
    if (possibleParents.length) {
      reportingTo = pick(possibleParents).trainer_id;
    }
  }

  if (shouldBreak) {
    // Simulate real-world API inconsistency (broken foreign key)
    reportingTo = Math.random() < 0.5 ? null : 9999;
  }

  trainers.push({
    trainer_id: i,
    trainer_name: `${pick(firstNames)} ${pick(lastNames)}`,
    reporting_to: reportingTo,
    level,
  });
}

export default trainers;
