/**
 * Test data generators and factories for creating unique test data
 */

/**
 * Generates a unique email address with timestamp
 */
export function uniqueEmail(prefix: string = 'user'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

/**
 * Generates a unique username with timestamp
 */
export function uniqueUsername(prefix: string = 'user'): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * Generates a random string of specified length
 */
export function randomString(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sample data factories
 */
export const sampleData = {
  titles: [
    'Important Task',
    'Meeting Notes',
    'Project Update',
    'Bug Report',
    'Feature Request',
    'Documentation',
    'Code Review',
    'Testing Notes',
  ],

  descriptions: [
    'This is a sample description for testing purposes.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'A detailed description that explains the context and requirements.',
    'Short description.',
    'This description contains multiple sentences. It provides more context. Perfect for testing.',
  ],

  names: [
    'John Doe',
    'Jane Smith',
    'Alice Johnson',
    'Bob Wilson',
    'Carol Brown',
    'David Davis',
    'Eve Miller',
    'Frank Garcia',
  ],

  companies: [
    'Acme Corp',
    'Tech Solutions Inc',
    'Innovation Labs',
    'Digital Dynamics',
    'Future Systems',
    'Smart Solutions',
    'NextGen Technologies',
    'Advanced Analytics',
  ],
};

/**
 * Gets a random item from an array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Creates sample user data
 */
export function createSampleUser(
  overrides: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    fullName: string;
  }> = {}
) {
  const firstName =
    overrides.firstName ||
    randomItem(sampleData.names.map((n) => n.split(' ')[0]));
  const lastName =
    overrides.lastName ||
    randomItem(sampleData.names.map((n) => n.split(' ')[1]));

  return {
    email: overrides.email || uniqueEmail(firstName.toLowerCase()),
    password: overrides.password || 'TestPassword123!',
    firstName,
    lastName,
    fullName: overrides.fullName || `${firstName} ${lastName}`,
  };
}

/**
 * Creates sample entity data (for CRUD operations)
 */
export function createSampleEntity(
  type: 'item' | 'note' | 'task' | 'generic' = 'generic',
  overrides: Record<string, any> = {}
) {
  const baseData = {
    title: randomItem(sampleData.titles),
    description: randomItem(sampleData.descriptions),
    name: randomItem(sampleData.names),
    ...overrides,
  };

  switch (type) {
    case 'item':
      return {
        name: baseData.title,
        description: baseData.description,
        category: randomItem([
          'Electronics',
          'Books',
          'Clothing',
          'Home',
          'Sports',
        ]),
        price: Math.floor(Math.random() * 1000) + 10,
        ...overrides,
      };

    case 'note':
      return {
        title: baseData.title,
        content: baseData.description,
        tags: randomItem(['personal', 'work', 'important', 'todo', 'idea']),
        ...overrides,
      };

    case 'task':
      return {
        title: baseData.title,
        description: baseData.description,
        priority: randomItem(['low', 'medium', 'high', 'urgent']),
        status: randomItem(['todo', 'in_progress', 'done']),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        ...overrides,
      };

    default:
      return {
        title: baseData.title,
        description: baseData.description,
        name: baseData.name,
        ...overrides,
      };
  }
}

/**
 * Validation test data - invalid inputs for testing form validation
 */
export const invalidData = {
  emails: [
    '',
    'invalid-email',
    '@example.com',
    'user@',
    'user@.com',
    'user..double.dot@example.com',
  ],

  passwords: [
    '',
    '123',
    'short',
    'onlylowercase',
    'ONLYUPPERCASE',
    '12345678',
    'NoNumbersOrSpecial',
  ],

  requiredFields: ['', '   ', '\t\n'],
};
