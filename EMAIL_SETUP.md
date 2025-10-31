# Configuration de l'envoi d'emails pour la récupération de mot de passe

## 📧 État actuel

La fonctionnalité de récupération de mot de passe est **déjà implémentée** dans votre application Laravel.
Les routes et contrôleurs nécessaires sont en place :
- `/forgot-password` - Demande de réinitialisation
- `/reset-password/{token}` - Formulaire de réinitialisation

Actuellement, les emails sont enregistrés dans les logs (`storage/logs/laravel.log`) au lieu d'être envoyés.

## 🚀 Options de configuration

### Option 1 : Gmail (Recommandé pour le développement)

1. **Créer un mot de passe d'application Gmail** :
   - Allez sur https://myaccount.google.com/security
   - Activez la validation en 2 étapes
   - Créez un "Mot de passe d'application"

2. **Modifiez votre fichier `.env`** :
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-application
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=votre-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Option 2 : Mailtrap (Idéal pour les tests)

Mailtrap capture tous les emails sans les envoyer réellement.

1. **Inscrivez-vous sur** : https://mailtrap.io
2. **Copiez les identifiants de votre inbox**
3. **Modifiez votre fichier `.env`** :
```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=votre-username-mailtrap
MAIL_PASSWORD=votre-password-mailtrap
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@events.local
MAIL_FROM_NAME="${APP_NAME}"
```

### Option 3 : SendGrid (Production)

1. **Inscrivez-vous sur** : https://sendgrid.com
2. **Créez une API Key**
3. **Installez le driver** :
```bash
composer require symfony/sendgrid-mailer
```

4. **Modifiez votre fichier `.env`** :
```env
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=votre-api-key
MAIL_FROM_ADDRESS=noreply@votredomaine.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Option 4 : Mailgun (Production)

1. **Inscrivez-vous sur** : https://www.mailgun.com
2. **Obtenez vos identifiants API**
3. **Installez le driver** :
```bash
composer require symfony/mailgun-mailer
```

4. **Modifiez votre fichier `.env`** :
```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=votredomaine.com
MAILGUN_SECRET=votre-api-key
MAIL_FROM_ADDRESS=noreply@votredomaine.com
MAIL_FROM_NAME="${APP_NAME}"
```

## 🧪 Tester la configuration

### 1. Via Tinker
```bash
php artisan tinker
```

Puis exécutez :
```php
Mail::raw('Test email', function($message) {
    $message->to('test@example.com')->subject('Test');
});
```

### 2. Via la fonctionnalité mot de passe oublié

1. Allez sur : http://127.0.0.1:8000/forgot-password
2. Entrez votre email
3. Vérifiez :
   - **Si MAIL_MAILER=log** : Consultez `storage/logs/laravel.log`
   - **Si Mailtrap** : Consultez votre inbox Mailtrap
   - **Si Gmail** : Vérifiez votre boîte de réception

## 🔍 Vérifier les emails dans les logs

Si vous utilisez la configuration par défaut (`MAIL_MAILER=log`), les emails sont dans :
```bash
tail -f storage/logs/laravel.log
```

## 🎨 Personnaliser les emails

Les templates d'email sont dans :
- `resources/views/emails/` (si vous créez des vues personnalisées)
- Les notifications Laravel utilisent des vues par défaut

Pour personnaliser, vous pouvez publier les vues :
```bash
php artisan vendor:publish --tag=laravel-mail
```

## ⚙️ Configuration avancée

### File d'attente pour les emails (Recommandé en production)

1. **Modifiez `.env`** :
```env
QUEUE_CONNECTION=database
```

2. **Créez les tables de queue** (déjà fait dans votre projet) :
```bash
php artisan migrate
```

3. **Démarrez le worker** :
```bash
php artisan queue:work
```

Les emails seront maintenant envoyés en arrière-plan !

## 🐛 Dépannage

### Erreur "Connection refused"
- Vérifiez vos identifiants SMTP
- Vérifiez que le port est correct (587 ou 465)

### Emails non reçus
- Vérifiez le dossier spam
- Consultez les logs : `storage/logs/laravel.log`
- Testez avec Mailtrap d'abord

### "Too many login attempts"
- Gmail peut bloquer si vous testez trop rapidement
- Utilisez Mailtrap pour les tests

## 📝 Commandes utiles

```bash
# Tester la configuration email
php artisan tinker

# Vider le cache de configuration
php artisan config:clear

# Voir les emails dans les logs (mode log)
tail -f storage/logs/laravel.log

# Traiter la file d'attente des emails
php artisan queue:work

# Voir les jobs en attente
php artisan queue:failed
```

## ✅ Checklist de mise en production

- [ ] Choisir un service d'envoi professionnel (SendGrid, Mailgun, SES)
- [ ] Configurer un domaine d'envoi vérifié
- [ ] Activer la file d'attente (`QUEUE_CONNECTION=database` ou `redis`)
- [ ] Configurer Supervisor pour le queue worker
- [ ] Tester l'envoi depuis la production
- [ ] Surveiller les bounces et rejets

## 🔗 Liens utiles

- [Documentation Laravel Mail](https://laravel.com/docs/11.x/mail)
- [Mailtrap](https://mailtrap.io)
- [SendGrid](https://sendgrid.com)
- [Mailgun](https://www.mailgun.com)
