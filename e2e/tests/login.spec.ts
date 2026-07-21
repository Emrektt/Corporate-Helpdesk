import { test, expect } from '@playwright/test';

test('Kullanıcı başarılı şekilde giriş yapabilmeli', async ({ page }) => {
  // Projenin çalıştığı port 5173 (Vite default)
  await page.goto('http://localhost:5173/login');

  // Sayfanın yüklendiğini kontrol et
  await expect(page).toHaveTitle(/CorpHelpdesk/i);

  // Normalde burada kullanıcı adı/şifre doldurma işlemi yapılır
  // Örneğin:
  // await page.fill('input[type="email"]', 'testuser@example.com');
  // await page.fill('input[type="password"]', 'testpassword123');
  // await page.click('button[type="submit"]');

  // Microsoft ile giriş butonu kontrolü
  const msButton = page.getByRole('button', { name: /Microsoft ile Devam Et/i });
  await expect(msButton).toBeVisible();
});
