# 🔨 Jenkins CI/CD - Practical Example

## What Happens When You Push Code?

```
You push code → GitHub → Jenkins detects change → Runs Pipeline
                                                   ↓
                        ✅ Tests Pass → Deploy    ❌ Tests Fail → Notify Team
```

---

## Step-by-Step Example: First Jenkins Build

### 1. **Install Jenkins Locally (Docker)**

```powershell
# Start Jenkins in Docker
docker run -d -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts

# Get initial admin password
docker exec $(docker ps -q -f "ancestor=jenkins/jenkins:lts") cat /var/jenkins_home/secrets/initialAdminPassword
```

### 2. **Configure Jenkins (First Time)**

1. Open: http://localhost:8080
2. Paste the admin password
3. Install suggested plugins
4. Create admin user

### 3. **Create Your First Pipeline Job**

1. Click **New Item**
2. Name: `ReservationApp-CI`
3. Select: **Pipeline**
4. Click **OK**

### 4. **Configure Pipeline**

**In "Pipeline" section:**
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/Azaziop/reservationRepo.git`
- Branch: `*/master`
- Script Path: `Jenkinsfile`

**Click Save**

---

## Example: Manual Test Run

### Trigger a Build Manually

1. Go to your job: `ReservationApp-CI`
2. Click **Build Now**
3. Watch the **Console Output**

### What You'll See:

```
[Pipeline] Start
[Pipeline] stage (Checkout)
+ git clone https://github.com/Azaziop/reservationRepo.git
✅ Checkout complete

[Pipeline] stage (Install Dependencies)
+ composer install
✅ PHP dependencies installed
+ npm install  
✅ Node dependencies installed

[Pipeline] stage (Database Setup)
+ php artisan migrate:fresh --seed
✅ Database migrated

[Pipeline] stage (Build Assets)
+ npx vite build
✅ Assets compiled

[Pipeline] stage (Run Tests)
+ php artisan test
✅ All tests passed (23/23)

[Pipeline] Success
✅ Build #1 completed successfully in 3m 45s
```

---

## Real-World Scenario Example

### Scenario: You fix a bug

```powershell
# 1. Make changes to code
code app/Http/Controllers/ReservationController.php

# 2. Write a test
code tests/Feature/ReservationTest.php

# 3. Commit and push
git add .
git commit -m "Fix: reservation date validation"
git push origin master
```

### What Jenkins Does Automatically:

```
🔄 Jenkins detects push
  ↓
📥 Pulls your code
  ↓
🔧 Installs dependencies
  ↓
🗄️ Sets up test database
  ↓
🧪 Runs your new test
  ↓
✅ Test passes → Build succeeds → You get notification
❌ Test fails → Build fails → You get email with error
```

---

## Example: Failed Build Notification

If tests fail, Jenkins shows:

```
❌ Build #42 Failed

Stage: Run Tests
Error: 
  FAILED  Tests\Feature\ReservationTest > it validates reservation dates
  
  Expected date to be in future, got past date
  
  at tests/Feature/ReservationTest.php:45
  
Duration: 2m 13s
Commit: a3f4c2d "Fix: reservation date validation"
```

---

## Common Jenkins Commands in Your Pipeline

### From Jenkinsfile:

```groovy
// Install PHP dependencies
bat 'composer install --no-interaction --prefer-dist'

// Setup Laravel environment  
bat 'php artisan key:generate'
bat 'php artisan migrate:fresh --seed --force'

// Build frontend assets
bat 'npx vite build'

// Run tests
bat 'php artisan test --parallel'

// Security audit
bat 'composer audit'
bat 'npm audit'
```

---

## Example: Viewing Build Results

### In Jenkins Dashboard:

```
┌─────────────────────────────────────────────────┐
│ ReservationApp-CI                               │
├─────────────────────────────────────────────────┤
│ ✅ Build #5  - SUCCESS  (3m 21s)  - master     │
│ ✅ Build #4  - SUCCESS  (3m 45s)  - master     │
│ ❌ Build #3  - FAILURE  (1m 12s)  - master     │
│ ✅ Build #2  - SUCCESS  (4m 01s)  - master     │
│ ✅ Build #1  - SUCCESS  (5m 33s)  - master     │
└─────────────────────────────────────────────────┘
```

Click any build to see:
- Console output
- Test results
- Duration graphs
- Changed files

---

## Example: Integrate with GitHub Webhooks

### Setup Automatic Builds on Push:

1. **In Jenkins Job Settings:**
   - Build Triggers → ✅ **GitHub hook trigger for GITScm polling**

2. **In GitHub Repository Settings:**
   - Settings → Webhooks → Add webhook
   - Payload URL: `http://your-jenkins-url:8080/github-webhook/`
   - Content type: `application/json`
   - Events: ✅ **Just the push event**

Now every `git push` automatically triggers Jenkins!

---

## Example: Local Jenkins Testing (Without Server)

You can simulate Jenkins locally:

```powershell
# Navigate to your project
cd C:\Users\SETUP GAME\Documents\GitHub\reservationRepo

# Run the same commands Jenkins would run:

# 1. Install dependencies
composer install --no-interaction
npm install

# 2. Setup environment
if (!(Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate

# 3. Setup test database
php artisan migrate:fresh --seed --force

# 4. Build assets
npx vite build

# 5. Run tests
php artisan test

# If all pass ✅ - Jenkins will pass too!
```

---

## Benefits in Your Project

✅ **Automatic Testing** - Every code change is tested
✅ **Early Bug Detection** - Catch issues before production  
✅ **Code Quality** - Enforces coding standards
✅ **Security Scans** - Detects vulnerable packages
✅ **Team Visibility** - Everyone sees build status
✅ **Faster Development** - Automated testing saves time

---

## Next Steps

1. **Install Jenkins** (Docker command above)
2. **Create pipeline job** pointing to your Jenkinsfile
3. **Add GitHub webhook** for automatic builds
4. **Configure notifications** (email/Slack)
5. **Push code** and watch Jenkins work!

---

## Troubleshooting

### Build fails with "vendor missing"?
- Check Composer installation stage in console output
- Verify PHP version matches (8.4)

### Database connection errors?
- Ensure MySQL is running on localhost:3306
- Check DB credentials in .env match DB_USERNAME/DB_PASSWORD

### npm errors?
- Clear node_modules: `rmdir /s /q node_modules`
- Clear npm cache: `npm cache clean --force`
