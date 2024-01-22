import { chromium }  from 'playwright';
import 'dotenv/config';
import * as OTPAuth from "otpauth";
import { parseArgs } from 'node:util';

main();

async function main() {
  const argOptions = {
    firstName: {
      type: 'string',
      short: 'f',
    },
    lastName: {
      type: 'string',
      short: 'l',
    },
    startDate: {
      type: 'string',
      short: 's',
    },
    endDate: {
      type: 'string',
      short: 'e',
    },
  } as const;
  const { values: options } = parseArgs({ options: argOptions });
  // validate options
  if (!options.firstName || !options.lastName || !options.startDate || !options.endDate) {
    console.log('Missing options');
    return;
  }
  const dateRegex = /^20[0-9][0-9]-[01][0-9]-[0-3][0-9]$/;
  if (!options.startDate.match(dateRegex) || !options.endDate.match(dateRegex)) {
    console.log('Invalid date format. Expects YYYY-MM-DD');
    return;
  }
  await createNewUser(options as UserOptions);
}

interface UserOptions {
  firstName: string;
  lastName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

function generateRandomCode(): string {
   const min = 0;
  const max = 9999;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  return value.toString().padStart(4, '0');
}

async function createNewUser(options: UserOptions): Promise<void> {
  const username = process.env.username;
  const password = process.env.password;
  const totpSecret = process.env.totpSecret;

  if (!username || !password || !totpSecret) {
    throw new Error('Missing username, password or totpSecret in .env file');
  }
  // Create a new TOTP object.
  let totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: totpSecret,
  });

  const randomCode = generateRandomCode();
  const launchOptions = {
    headless: false,
  }
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.alarm.com/login.aspx');
  await page.getByPlaceholder('Username').click();
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Username').press('Tab');
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  console.log('Logged in');

  // 2FA
  const token = totp.generate();
  await page.getByPlaceholder('------').fill(token);
  await page.getByRole('button', { name: 'Vérifier' }).click();
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  console.log(`2FA verified with ${token}`);

  // create user
  await page.getByRole('link', { name: 'Utilisateurs' }).click();
  await page.getByRole('button', { name: 'Ajouter un utilisateur' }).click();
  await page.getByPlaceholder('Prénom').click();
  await page.getByPlaceholder('Prénom').fill(options.firstName);
  await page.getByPlaceholder('Nom de famille').click();
  await page.getByPlaceholder('Nom de famille').fill(options.lastName);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Créer' }).click();
  console.log('User created');

  // alarm code
  await page.getByPlaceholder('----').click();
  await page.getByPlaceholder('----').fill(randomCode);
  console.log(`Alarm code set to ${randomCode}`);
  await page.getByLabel('Panneau de sécurité\n    \n    \n\n                    Panel').check();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.getByRole('button', { name: 'Horaire Tout' }).click();
  await page.getByLabel('Accès temporaire').click();
  await page.getByRole('textbox').first().fill(options.startDate);
  await page.getByPlaceholder('HH:MM').first().click();
  await page.getByPlaceholder('HH:MM').first().fill('13:00');
  await page.getByRole('textbox').nth(2).fill(options.endDate);
  await page.getByPlaceholder('HH:MM').nth(1).click();
  await page.getByPlaceholder('HH:MM').nth(1).fill('12:00');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  console.log('Access limited to date period');

  await browser.close();
  console.log('Done!');
}
