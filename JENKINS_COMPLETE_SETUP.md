# 🚀 Jenkins Setup Guide - Native Windows Installation

## Prerequisites

✅ Your Laravel project (reservationRepo)
✅ Git installed
✅ Admin rights on Windows

---

## Part 1: Install Java (Required for Jenkins)

### Step 1: Download and Install Java 21

1. Go to: https://adoptium.net/temurin/releases/
2. Select:
   - **Operating System**: Windows
   - **Architecture**: x64
   - **Package Type**: JDK
   - **Version**: 21 (LTS)
3. Download the `.msi` installer
4. Run the installer with default settings
5. ✅ Check "Add to PATH" during installation

### Step 2: Verify Java Installation

Open PowerShell:

```powershell
# Check Java version
java -version

# Should show: openjdk version "21.x.x"
```

If not found, add to PATH manually:
1. Search Windows for "Environment Variables"
2. Edit "Path" → Add: `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot\bin`

---

## Part 2: Install Jenkins on Windows

### Step 1: Download Jenkins

1. Go to: https://www.jenkins.io/download/
2. Under "Long-term Support (LTS)", click **Windows**
3. Download the `.msi` installer (jenkins.msi)

### Step 2: Run Jenkins Installer

1. Double-click `jenkins.msi`
2. Click **Next**
3. **Destination Folder**: Use default `C:\Program Files\Jenkins\` or choose your own
4. **Logon Type**: Select **"Run service as LocalSystem"** (recommended)
5. **Port**: Keep default **8080** (or change if needed)
6. **Java home directory**: Should auto-detect (if not, select manually: `C:\Program Files\Eclipse Adoptium\jdk-21...`)
7. Click **Next** → **Install**
8. Click **Finish**

**Jenkins is now running as a Windows Service!**

### Step 3: Get Initial Admin Password

Open PowerShell:

```powershell
# Navigate to Jenkins secrets folder
cd "C:\Program Files\Jenkins\secrets"

# Display the password
Get-Content initialAdminPassword
```

**Or manually:**
1. Open File Explorer
2. Navigate to: `C:\Program Files\Jenkins\secrets\`
3. Open `initialAdminPassword` with Notepad
4. Copy the password

**Copy this password - you'll need it!**

---

## Part 2: Initial Jenkins Setup

### Step 1: Access Jenkins

Open your browser: **http://localhost:8080**

### Step 2: Unlock Jenkins

1. Paste the admin password you copied
2. Click **Continue**

### Step 3: Install Plugins

1. Select **Install suggested plugins**
2. Wait for installation (5-10 minutes)

### Step 4: Create Admin User

Fill in the form:
- **Username**: `admin` (or your choice)
- **Password**: Choose a strong password
- **Full name**: Your name
- **Email**: Your email

Click **Save and Continue**

### Step 5: Jenkins URL

Keep default: `http://localhost:8080/`

Click **Save and Finish** → **Start using Jenkins**

---

## Part 3: Install Required Plugins

### Navigate to Plugin Manager

1. Click **Manage Jenkins** (left sidebar)
2. Click **Plugins** (or **Manage Plugins**)
3. Click **Available plugins** tab

### Search and Install These Plugins:

Type in search box and check the boxes:

- ✅ **Git plugin** (should already be installed)
- ✅ **GitHub plugin**
- ✅ **Pipeline**
- ✅ **Docker Pipeline** (optional, for advanced Docker builds)
- ✅ **Blue Ocean** (optional, for better UI)

Click **Install** (without restart)

Wait for installation to complete.

---

## Part 4: Configure System Tools

### Step 1: Add XAMPP PHP to System PATH

Since you have XAMPP installed, add it to Windows PATH:

```powershell
# Check your XAMPP PHP location (usually C:\xampp\php)
Test-Path "C:\xampp\php\php.exe"

# Add to PATH temporarily (current session)
$env:Path += ";C:\xampp\php"

# Add to PATH permanently
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\xampp\php", [System.EnvironmentVariableTarget]::Machine)

# Verify PHP is accessible
php -v
```

**Or manually add to PATH:**
1. Search Windows for "Environment Variables"
2. Click "Environment Variables" button
3. Under "System variables", select "Path" → Click "Edit"
4. Click "New" → Add: `C:\xampp\php`
5. Click "OK" on all dialogs
6. **Restart PowerShell** for changes to take effect

### Step 2: Verify Composer

```powershell
# Check if Composer is accessible
composer -V

# If not found, add Composer to PATH
# Usually located at: C:\ProgramData\ComposerSetup\bin
$env:Path += ";C:\ProgramData\ComposerSetup\bin"
```

### Step 3: Verify/Install Node.js

```powershell
# Check if Node.js is installed
node -v
npm -v
```

**If not installed:**
1. Download from: https://nodejs.org/
2. Choose **LTS version** (20.x)
3. Run installer with default settings

### Step 4: Configure Git in Jenkins

1. Go to **Manage Jenkins** → **Tools**
2. Scroll to **Git installations**
3. Click **Add Git**
   - Name: `Default`
   - Path to Git executable: `git` (or `C:\Program Files\Git\bin\git.exe`)
4. Click **Save**

---

## Part 5: Create Your First Pipeline Job

### Step 1: Create New Job

1. From Jenkins Dashboard, click **New Item** (top left)
2. Enter name: `ReservationApp-CI`
3. Select **Pipeline**
4. Click **OK**

### Step 2: Configure General Settings

In the configuration page:

**Description:**
```
Continuous Integration pipeline for Reservation App
Runs tests, code quality checks, and builds on every commit
```

**GitHub project** (optional):
- ✅ Check **GitHub project**
- Project url: `https://github.com/Azaziop/reservationRepo/`

### Step 3: Build Triggers

✅ Check **Poll SCM**
- Schedule: `H/5 * * * *` (checks every 5 minutes)

**Or for automatic builds with webhooks (requires public Jenkins):**
- ✅ Check **GitHub hook trigger for GITScm polling**

### Step 4: Pipeline Configuration

Scroll to **Pipeline** section:

**Definition:** Select `Pipeline script from SCM`

**SCM:** Select `Git`

**Repository URL:** 
```
https://github.com/Azaziop/reservationRepo.git
```

**Credentials:** Leave as `- none -` (for public repos)

**Branch Specifier:** `*/master`

**Script Path:** `Jenkinsfile`

Click **Save**

---

## Part 6: Setup MySQL for Jenkins Tests

Jenkins needs a MySQL database for running tests.

### Use XAMPP MySQL (Easiest!)

Since you have XAMPP, you already have MySQL installed!

#### Step 1: Start XAMPP MySQL

1. Open **XAMPP Control Panel**
2. Click **Start** next to MySQL
3. Verify it's running on port **3306**

#### Step 2: Create Test Database

```powershell
# Option A: Using XAMPP shell
cd C:\xampp\mysql\bin
.\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS reservation_test;"

# Option B: Using phpMyAdmin
# Open: http://localhost/phpmyadmin
# Click "New" → Database name: "reservation_test" → Create
```

#### Step 3: Verify Database Connection

```powershell
# Test connection
cd C:\xampp\mysql\bin
.\mysql.exe -u root -e "SHOW DATABASES;"

# Should see "reservation_test" in the list
```

**Your Jenkinsfile is already configured correctly:**
- DB_HOST: `localhost`
- DB_PORT: `3306`
- DB_USERNAME: `root`
- DB_PASSWORD: `` (empty)
- DB_DATABASE: `reservation_test`

**That's it!** Jenkins will use your XAMPP MySQL for testing.

### Alternative: Use Docker MySQL (If you prefer isolation)

```powershell
# Run MySQL container only
docker run -d `
  --name mysql-jenkins `
  -e MYSQL_ROOT_PASSWORD= `
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes `
  -e MYSQL_DATABASE=reservation_test `
  -p 3307:3306 `
  mysql:8.0

# Update Jenkinsfile to use port 3307
```

---

## Part 7: Run Your First Build!

### Step 1: Trigger Build

1. Go to your job: `ReservationApp-CI`
2. Click **Build Now** (left sidebar)

### Step 2: Watch Build Progress

1. A build will appear in **Build History**
2. Click on the **#1** (build number)
3. Click **Console Output** to watch real-time logs

### What You'll See:

```
Started by user admin
Checking out git repository...
✓ Checkout complete

[Pipeline] stage (Install Dependencies)
+ composer install
Loading composer repositories with package information
Installing dependencies...
✓ PHP dependencies installed

[Pipeline] stage (Run Tests)
+ php artisan test
✓ All tests passed

[Pipeline] SUCCESS
Finished: SUCCESS
```

---

## Part 8: Understanding Build Results

### Build Status Icons:

- ☀️ **Blue/Green** = Success (all tests passed)
- ☁️ **Yellow** = Unstable (tests passed but with warnings)
- ⛈️ **Red** = Failure (tests failed or build error)
- ⚪ **Gray** = Not built yet or aborted

### View Results:

1. Click on any build number
2. You'll see:
   - **Console Output** - Full logs
   - **Changes** - What code changed
   - **Test Result** - Test summary
   - **Duration** - How long it took

---

## Part 9: Test Automatic Builds

### Make a Change and Push:

```powershell
# In your project directory
cd "C:\Users\SETUP GAME\Documents\GitHub\reservationRepo"

# Make a small change
echo "# Jenkins CI Test" >> README.md

# Commit and push
git add .
git commit -m "Test Jenkins CI"
git push origin master
```

### Watch Jenkins:

- Within 5 minutes, Jenkins will detect the change
- It will automatically start a new build
- Check **Build History** for the new build

---

## Part 10: Common Tasks

### View All Builds

Dashboard → Your job → See full build history

### Stop a Running Build

Click **Abort** in the build page

### Re-run a Failed Build

Click **Rebuild** in the build page

### Delete Old Builds

Configure job → **Discard old builds**
- Days to keep builds: `30`
- Max # of builds to keep: `10`

### Schedule Builds

Configure job → Build Triggers → Build periodically
- `H 2 * * *` = Run at 2 AM daily
- `H H * * 0` = Run weekly on Sunday

### Email Notifications

1. **Manage Jenkins** → **System**
2. Scroll to **E-mail Notification**
3. Configure SMTP server
4. In your job: **Post-build Actions** → **E-mail Notification**

---

## Part 11: Blue Ocean (Modern UI)

### Access Blue Ocean

1. Install **Blue Ocean** plugin (if not installed)
2. Click **Open Blue Ocean** (left sidebar)
3. Better visualization of pipeline stages

### Features:

- Visual pipeline editor
- Better test result display
- Easier to see which stage failed
- Modern, cleaner interface

---

## Troubleshooting

### Build Fails with "composer not found"

```powershell
docker exec -it jenkins bash
composer --version
# If not found, reinstall composer (see Part 4, Step 2)
```

### Build Fails with "php artisan not found"

Check your Jenkinsfile paths and ensure `vendor/autoload.php` exists

### Database Connection Error

```powershell
# Check if MySQL is accessible from Jenkins container
docker exec jenkins mysql -h localhost -u root -e "SHOW DATABASES;"
```

### Git Authentication Issues (Private Repo)

1. **Manage Jenkins** → **Credentials** → **Add Credentials**
2. Kind: **Username with password**
3. Username: Your GitHub username
4. Password: Personal Access Token from GitHub
5. ID: `github-credentials`
6. Use these credentials in your job configuration

### Port Already in Use

```powershell
# Stop existing Jenkins
docker stop jenkins
docker rm jenkins

# Start with different port
docker run -d --name jenkins -p 8081:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
# Access at http://localhost:8081
```

---

## Quick Reference Commands

### Jenkins Service Management

```powershell
# Start Jenkins service
Start-Service Jenkins

# Stop Jenkins service
Stop-Service Jenkins

# Restart Jenkins service
Restart-Service Jenkins

# Check Jenkins status
Get-Service Jenkins

# View Jenkins logs
Get-Content "C:\Program Files\Jenkins\jenkins.out.log" -Tail 50 -Wait
```

### Jenkins Directories

```powershell
# Jenkins installation
cd "C:\Program Files\Jenkins"

# Jenkins home (workspace, configs, plugins)
cd "C:\ProgramData\Jenkins\.jenkins"

# Or check environment variable
echo $env:JENKINS_HOME

# View logs
cd "C:\Program Files\Jenkins"
notepad jenkins.out.log
```

### Backup Jenkins

```powershell
# Backup Jenkins home folder
$date = Get-Date -Format "yyyy-MM-dd"
Compress-Archive -Path "C:\ProgramData\Jenkins\.jenkins" -DestinationPath "jenkins-backup-$date.zip"
```

### Uninstall Jenkins

```powershell
# Stop service
Stop-Service Jenkins

# Uninstall via Windows Settings > Apps > Jenkins
# Or via Control Panel > Programs > Uninstall

# Remove data (optional)
Remove-Item "C:\ProgramData\Jenkins" -Recurse -Force
```

---

## Next Steps

✅ Jenkins is running
✅ Pipeline job created
✅ First build successful

**Now you can:**

1. ✨ Add more test coverage to your Laravel app
2. 🔒 Integrate SonarQube for code quality
3. 🚀 Add deployment stages (CD)
4. 📧 Configure email/Slack notifications
5. 🐳 Build and push Docker images
6. ☸️ Deploy to Kubernetes with Argo CD

---

## Jenkins Best Practices

1. **Always use version control** for Jenkinsfile
2. **Keep builds fast** (< 10 minutes)
3. **Run tests in parallel** when possible
4. **Archive test results** for history
5. **Use environment variables** for secrets
6. **Clean workspace** between builds
7. **Monitor build trends** over time

---

## Resources

- 📚 Jenkins Documentation: https://www.jenkins.io/doc/
- 💬 Jenkins Community: https://community.jenkins.io/
- 🎓 Jenkins Tutorials: https://www.jenkins.io/doc/tutorials/

---

## Summary

You now have:
- ✅ Jenkins running in Docker
- ✅ Pipeline configured for your Laravel app  
- ✅ Automatic testing on every commit
- ✅ Build history and reports

Every time you push code, Jenkins will automatically:
1. Pull your latest code
2. Install dependencies
3. Run your tests
4. Report success or failure

**Happy CI/CD! 🎉**
