const { Client } = require('pg');

const passwords = ['', 'postgres', 'admin', 'root', '123456', 'password', '1234', 'admin123', 'schedule123'];

async function testPasswords() {
  for (const password of passwords) {
    console.log(`Testing password: "${password}"...`);
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: password,
      port: 5432,
    });
    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Password is "${password}"`);
      await client.end();
      return password;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  console.log('None of the common passwords worked.');
}

testPasswords();
