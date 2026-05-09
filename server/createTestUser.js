import 'dotenv/config';
import mongoConnect from './config/database.js';
import User from './models/User.js';

const USERNAME = 'testuser';
const EMAIL = 'testuser@example.com';
const PASSWORD = 'P@ssw0rd123';

const createUser = async () => {
  await mongoConnect();

  const existing = await User.findOne({ $or: [{ username: USERNAME }, { email: EMAIL }] }).select('+password');
  if (existing) {
    console.log('Test user already exists:');
    console.log(`  username: ${existing.username}`);
    console.log(`  email: ${existing.email}`);
    console.log('Password: P@ssw0rd123');
    process.exit(0);
  }

  const user = new User({
    username: USERNAME,
    email: EMAIL,
    password: PASSWORD,
    isEmailVerified: true,
  });

  await user.save();
  console.log('Created test user successfully:');
  console.log(`  username: ${USERNAME}`);
  console.log(`  email: ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  process.exit(0);
};

createUser().catch((error) => {
  console.error('Failed to create test user:', error);
  process.exit(1);
});
