import React, { useState, useRef, useEffect, useCallback } from "react";
import { DZ_COMMUNES } from "./communes";
import { sanitizeEmail, isBlockedDomain, isValidAlgerianPhone, getOrCreateUID, getTierForCount, getNextTier, tierProgressPct, TIERS } from "./utils/email";

const WILAYAS = Object.keys(DZ_COMMUNES);
const DEFAULT_ACCOUNTS: string[] = [];
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '') as string;

// ── i18n ──────────────────────────────────────────────────────────────────────
const LANGS = {
  ar: {
    dir:"rtl" as const, name:"العربية",
    nav:["📦 المخزون","💬 الشات","📋 الطلبيات","📊 الإحصائيات","⚙️ الإعدادات"],
    loginTitle:"VipGoPay", loginSub:"مساعد التجار الإلكترونيين الجزائريين",
    loginGoogleBtn:"تسجيل الدخول بـ Google",
    loginChooseAccount:"اختر حسابك", loginAddAccount:"➕ استخدام حساب آخر",
    loginVerifying:"جاري التحقق مع Google...", loginEnterEmail:"أدخل بريدك الإلكتروني",
    loginEmailErr:"أدخل بريداً صحيحاً", loginContinue:"متابعة ⚡",
    loginBlockedDomain:"هذا النطاق غير مقبول (إيميل مؤقت)",
    addBtn:"+ منتج جديد", save:"حفظ", cancel:"إلغاء", search:"بحث...",
    pName:"اسم المنتج *", pCat:"الفئة", pPrice:"السعر (دج) *",
    pStock:"الكمية", pCond:"الحالة", pSpecs:"مواصفات / ملاحظات",
    conditions:["جديد","مستعمل","كابا","تالف جزئياً"],
    noProducts:"لا توجد منتجات", addHint:"اضغط + لإضافة منتج",
    outOfStock:"نافد", qty:"الكمية:",
    totalP:"المنتجات", availP:"متاح", outP:"نافد",
    bulkTitle:"إضافة كمية للمخزون", bulkPh:"الكمية المراد إضافتها",
    chatStep1:"📦 بيانات المنتج التجريبي",
    chatDemoName:"اسم المنتج *", chatDemoPrice:"السعر (دج) *", chatDemoSpecs:"مواصفات / ملاحظات",
    chatDemoNamePh:"مثال: هاتف سامسونج A15", chatDemoPricePh:"مثال: 45000",
    chatDemoRequired:"هذا الحقل مطلوب",
    chatDemoStart:"ابدأ التجربة ⚡", chatDemoReset:"↩ تغيير المنتج",
    chatWelcome:"أهلاً في", chatSub:"جرّب الذكاء الاصطناعي بالدارجة",
    startBtn:"ابدأ ⚡", newChat:"↩ جديد",
    inputPh:"اكتب رسالتك...", active:"● نشط",
    logoutBtn:"تسجيل الخروج 🚪", logoutQ:"هل تريد تسجيل الخروج؟",
    quick:["شحال الثمن؟","واش متوفر؟","نحجز واحدة","شحال التوصيل؟"],
    ordersTitle:"الطلبيات", noOrders:"لا توجد طلبيات",
    product:"المنتج:", pending:"معلّق", confirmed:"مؤكد", cancelled:"ملغي",
    confirm:"✅ تأكيد", cancelOrder:"✕ إلغاء",
    exportCSV:"📥 CSV", copied:"✅ تم النسخ!", shareLabel:"تواصل:",
    waMsg:"مرحبا {name}،\nطلبيتك {id} مسجّلة ✅\nالمنتج: {product}\nالسعر: {price} DZD\nشكراً!",
    filterAll:"الكل", filterPending:"معلّق", filterConfirmed:"مؤكد", filterCancelled:"ملغي",
    settingsTitle:"الإعدادات", shopName:"🏪 اسم المتجر",
    emailL:"📧 البريد الإلكتروني", shopType:"🗂️ نوع البضاعة",
    location:"📍 الموقع", hours:"🕐 أوقات العمل",
    officeD:"📦 توصيل المكتب (دج)", homeD:"🏠 توصيل المنزل (دج)",
    extra:"📝 تعليمات إضافية للذكاء الاصطناعي",
    shippingSection:"🚚 لوحة التوصيل — 58 ولاية",
    shippingAll:"كل الولايات", shippingCustom:"المخصّصة فقط",
    shippingSearch:"ابحث عن ولاية...",
    addRate:"+ إضافة ولاية", rateWilaya:"الولاية", rateOffice:"مكتب (دج)", rateHome:"منزل (دج)",
    notifSection:"🔔 الإشعارات",
    enableNotif:"تفعيل الإشعارات", notifEnabled:"✅ الإشعارات مفعّلة", notifDenied:"🚫 محظورة",
    muteNotif:"كتم إشعارات الطلبيات الجديدة",
    notifNewOrder:"طلبية جديدة!", notifOutStock:"⚠️ نفاد المخزون",
    model:"🤖 الموديل", theme:"🎨 المظهر", dark:"🌙 داكن", light:"☀️ فاتح",
    lang:"🌐 اللغة", saved:"✅ محفوظ تلقائياً",
    clearAll:"🗑️ مسح بيانات هذا الحساب", clearQ:"هل أنت متأكد؟",
    privacyBtn:"🔒 سياسة الخصوصية", privacyTitle:"سياسة الخصوصية — VipGoPay",
    privacyText:"📋 البيانات التي نجمعها\nنجمع البريد الإلكتروني لإدارة الحساب وتسجيل الدخول. نجمع بيانات المنتجات والطلبيات التي تُدخلها بنفسك. لا نجمع أي بيانات شخصية دون علمك أو موافقتك الصريحة.\n\n🔧 كيف نستخدم البيانات\nتُستخدم بيانات المتجر حصراً لتشغيل ميزات التطبيق: إدارة المخزون، معالجة الطلبيات، وإرسال الإشعارات. لا نستخدم بياناتك لأغراض إعلانية أو تجارية خارجية.\n\n🤖 الذكاء الاصطناعي (Gemini)\nمحادثات الشات تُرسل إلى Google Gemini API لتوليد الردود الآنية فقط. تخضع هذه البيانات لسياسة خصوصية Google المتاحة على policies.google.com. لا تُحفظ المحادثات دائمياً على خوادمنا.\n\n🔗 التكاملات (WhatsApp · Telegram · Instagram · Email)\nمفاتيح API الخاصة بمنصات التواصل تُخزَّن محلياً في متصفحك (localStorage) فقط ولا تُرفع إلى خوادمنا بشكل دائم. تُرسَل إلى الخادم الخلفي فقط لحظة إرسال الإشعارات.\n\n🛡️ الأمان\nجميع الاتصالات مشفّرة بـ HTTPS. لا نستطيع الوصول إلى البيانات المخزّنة محلياً في متصفحك. لا تُشارك مفاتيح API مع أي شخص.\n\n⚖️ حقوقك\nيمكنك حذف جميع بيانات حسابك في أي وقت عبر الإعدادات ← مسح البيانات. لا نبيع بياناتك لأي طرف ثالث ولا نشاركها لأغراض تجارية تحت أي ظرف.\n\n📅 تحديثات السياسة\nقد نُحدّث هذه السياسة دورياً. سيُعلَم المستخدمون بأي تغييرات جوهرية عبر التطبيق.\n\n📧 للتواصل: contact@vipgopay.dz",
    acceptPrivacy:"فهمت ✓", orderBanner:"طلبية جديدة مسجّلة!",
    apiNote:"⚙️ مفاتيح API محمية — تعمل عبر السيرفر الخلفي فقط.",
    integSection:"🔗 ربط المنصات الحقيقي",
    integNote:"أدخل بيانات الربط الحقيقية. تُحفظ بأمان وتُستخدم لإرسال إشعارات فعلية عند تأكيد كل طلبية.",
    waTitle:"💬 WhatsApp Business API", tgTitle:"✈️ Telegram Bot",
    igTitle:"📸 Instagram Direct (Meta API)", emailTitle:"📧 Email (API / SMTP)",
    waPhoneId:"Phone Number ID", waToken:"Access Token الدائم", waPhoneNum:"رقم الهاتف التجاري",
    waTokenPh:"EAAB...", waPhoneIdPh:"123456789012345", waPhoneNumPh:"+213XXXXXXXXX",
    tgToken:"Bot Token", tgChatId:"Chat ID / Channel ID",
    tgTokenPh:"123456:ABCdef...", tgChatIdPh:"-1001234567890",
    igAccountId:"Instagram Business Account ID", igToken:"Access Token",
    igEmail:"البريد المرتبط", igAccountIdPh:"17841XXXXXXXXX",
    igTokenPh:"EAAB...", igEmailPh:"page@instagram.com",
    igPageType:"نوع الحساب", igRecipientId:"Recipient IGSID (للاختبار)",
    igRecipientIdPh:"1234567890",
    igPageTypes:["Business Page","Creator Account","Personal Brand"],
    emailService:"الخدمة", emailApiKey:"API Key",
    emailSender:"بريد المرسل", emailSenderName:"اسم المرسل",
    emailApiKeyPh:"re_XXXXXXXXX أو host:port:user:pass", emailSenderPh:"no-reply@vipgopay.dz",
    emailSenderNamePh:"VipGoPay",
    saveInteg:"💾 حفظ الربط", integSaved:"✅ تم الحفظ",
    testNotif:"🧪 اختبار الإرسال", testSending:"جاري الاختبار...",
    emptyCredsErr:"⚠️ الرجاء إدخال مفاتيح الربط الحقيقية لتفعيل الإرسال",
    connected:"✅ مربوط", notConnected:"غير مربوط",
    webhookTitle:"🔗 رابط الـ Webhook", webhookSecret:"🔑 المفتاح السري",
    webhookNote:"استخدم هذا الرابط في Meta Business Manager",
    dashTitle:"📊 ملخص المبيعات", dashRevenue:"الإيرادات", dashOrders:"الطلبيات",
    dashTopProducts:"أكثر المنتجات طلباً", dashTopWilayas:"أكثر الولايات نشاطاً",
    notifLoading:"جاري الإرسال...", notifNoPlatforms:"⚠️ لا توجد منصات مُفعّلة",
    gamingHub:"📊 الإحصائيات",
    gamingWalletTitle:"💰 ملخص المالية",
    gamingRevenue:"إجمالي الإيرادات المؤكدة",
    gamingPoints:"🏆 نقاط الولاء",
    gamingPointsRate:"نقطة واحدة لكل 100 دج",
    gamingTierTitle:"📊 مستوى المتجر",
    gamingMonthly:"طلبيات مؤكدة هذا الشهر",
    gamingNextTierLabel:"للوصول إلى المستوى التالي",
    gamingTierDiscount:"خصم على الشحن",
    gamingTierMaxed:"🏆 أعلى مستوى — الماسي!",
    gamingQuickTitle:"⚡ طلبيات سريعة (One-Click)",
    gamingAddShortcut:"+ إضافة اختصار",
    gamingQuickName:"اسم المنتج / الباقة",
    gamingQuickGameId:"رقم مرجعي / ملاحظة",
    gamingQuickProduct:"المنتج المرتبط",
    gamingRechargeBtn:"طلبية سريعة ⚡",
    gamingDeleteShortcut:"حذف",
    gamingQuickModal:"تفاصيل الطلبية السريعة",
    gamingQuickCustName:"اسم الزبون *",
    gamingQuickCustPhone:"الهاتف *",
    gamingQuickConfirm:"تأكيد الطلبية ⚡",
    gamingQuickCreated:"✅ تم إنشاء الطلبية",
    twoFATitle:"🔒 التحقق الثنائي (2FA)",
    twoFAToggle:"تفعيل 2FA قبل تأكيد الطلبيات",
    twoFANoEmail:"أضف بريدك الإلكتروني في الإعدادات أولاً",
    twoFAModal:"✉️ رمز التحقق",
    twoFASent:"تم إرسال رمز 6 أرقام إلى",
    twoFACodePh:"000000",
    twoFAVerify:"تحقق ✓",
    twoFAResend:"↩ إرسال من جديد",
    twoFADevHint:"وضع التطوير — الرمز:",
    twoFAWrongCode:"رمز خاطئ، أعد المحاولة",
    twoFASending:"جاري الإرسال...",
    twoFAVerifying:"جاري التحقق...",
    twoFASuccess:"✅ تم التحقق — جاري تأكيد الطلبية...",
    uidLabel:"معرّف الحساب الفريد (UID)",
  },
  fr: {
    dir:"ltr" as const, name:"Français",
    nav:["📦 Inventaire","💬 Chat","📋 Commandes","📊 Stats","⚙️ Paramètres"],
    loginTitle:"VipGoPay", loginSub:"L'assistant des e-commerçants algériens",
    loginGoogleBtn:"Se connecter avec Google",
    loginChooseAccount:"Choisissez un compte", loginAddAccount:"➕ Autre compte",
    loginVerifying:"Vérification avec Google...", loginEnterEmail:"Entrez votre email",
    loginEmailErr:"Email invalide", loginContinue:"Continuer ⚡",
    loginBlockedDomain:"Domaine refusé (email temporaire)",
    addBtn:"+ Nouveau produit", save:"Enregistrer", cancel:"Annuler", search:"Rechercher...",
    pName:"Nom produit *", pCat:"Catégorie", pPrice:"Prix (DZD) *",
    pStock:"Quantité", pCond:"État", pSpecs:"Spécifications",
    conditions:["Neuf","Occasion","Kaba","Endommagé partiellement"],
    noProducts:"Aucun produit", addHint:"Cliquez + pour ajouter",
    outOfStock:"Rupture", qty:"Qté:",
    totalP:"Produits", availP:"Disponible", outP:"Rupture",
    bulkTitle:"Ajouter du stock", bulkPh:"Quantité à ajouter",
    chatStep1:"📦 Produit à tester",
    chatDemoName:"Nom produit *", chatDemoPrice:"Prix (DZD) *", chatDemoSpecs:"Spécifications",
    chatDemoNamePh:"Ex: Samsung Galaxy A15", chatDemoPricePh:"Ex: 45000",
    chatDemoRequired:"Champ requis",
    chatDemoStart:"Démarrer ⚡", chatDemoReset:"↩ Changer produit",
    chatWelcome:"Bienvenue chez", chatSub:"Testez l'IA en dialecte algérien",
    startBtn:"Démarrer ⚡", newChat:"↩ Nouveau",
    inputPh:"Écrivez votre message...", active:"● Actif",
    logoutBtn:"Déconnexion 🚪", logoutQ:"Se déconnecter?",
    quick:["Prix?","Disponible?","Commander","Livraison?"],
    ordersTitle:"Commandes", noOrders:"Aucune commande",
    product:"Produit:", pending:"En attente", confirmed:"Confirmé", cancelled:"Annulé",
    confirm:"✅ Confirmer", cancelOrder:"✕ Annuler",
    exportCSV:"📥 CSV", copied:"✅ Copié!", shareLabel:"Contact:",
    waMsg:"Bonjour {name},\nCommande {id} ✅\nProduit: {product}\nPrix: {price} DZD\nMerci!",
    filterAll:"Tout", filterPending:"En attente", filterConfirmed:"Confirmé", filterCancelled:"Annulé",
    settingsTitle:"Paramètres", shopName:"🏪 Nom boutique",
    emailL:"📧 Email", shopType:"🗂️ Type produits",
    location:"📍 Adresse", hours:"🕐 Horaires",
    officeD:"📦 Bureau (DZD)", homeD:"🏠 Domicile (DZD)",
    extra:"📝 Instructions IA supplémentaires",
    shippingSection:"🚚 Dashboard livraison — 58 Wilayas",
    shippingAll:"Toutes", shippingCustom:"Personnalisées",
    shippingSearch:"Rechercher...",
    addRate:"+ Wilaya", rateWilaya:"Wilaya", rateOffice:"Bureau", rateHome:"Domicile",
    notifSection:"🔔 Notifications",
    enableNotif:"Activer", notifEnabled:"✅ Activées", notifDenied:"🚫 Bloquées",
    muteNotif:"Couper notifs nouvelles commandes",
    notifNewOrder:"Nouvelle commande!", notifOutStock:"⚠️ Rupture",
    model:"🤖 Modèle", theme:"🎨 Thème", dark:"🌙 Sombre", light:"☀️ Clair",
    lang:"🌐 Langue", saved:"✅ Sauvegardé",
    clearAll:"🗑️ Effacer données", clearQ:"Êtes-vous sûr?",
    privacyBtn:"🔒 Confidentialité", privacyTitle:"Politique de confidentialité — VipGoPay",
    privacyText:"📋 Données collectées\nNous collectons votre email pour la gestion de compte. Nous collectons les données produits et commandes que vous saisissez. Aucune donnée personnelle n'est collectée sans votre consentement.\n\n🔧 Utilisation des données\nVos données sont utilisées exclusivement pour faire fonctionner l'application : gestion des stocks, commandes, notifications. Aucune utilisation publicitaire ou commerciale externe.\n\n🤖 Intelligence artificielle (Gemini)\nLes conversations sont envoyées à Google Gemini API pour générer des réponses en temps réel. Ces données sont soumises à la politique de confidentialité de Google sur policies.google.com.\n\n🔗 Intégrations (WhatsApp · Telegram · Instagram · Email)\nVos clés API sont stockées localement dans votre navigateur (localStorage) uniquement. Elles sont transmises au serveur uniquement lors de l'envoi de notifications.\n\n🛡️ Sécurité\nToutes les communications sont chiffrées en HTTPS. Nous ne pouvons pas accéder aux données stockées localement. Ne partagez jamais vos clés API.\n\n⚖️ Vos droits\nVous pouvez supprimer toutes vos données à tout moment via Paramètres → Effacer les données. Nous ne vendons ni ne partageons vos données à des tiers.\n\n📧 Contact : contact@vipgopay.dz",
    acceptPrivacy:"Compris ✓", orderBanner:"Nouvelle commande!",
    apiNote:"⚙️ Clés sécurisées côté serveur.",
    integSection:"🔗 Intégrations", integNote:"Credentials réels pour les vraies notifications.",
    waTitle:"💬 WhatsApp Business API", tgTitle:"✈️ Telegram Bot",
    igTitle:"📸 Instagram Direct", emailTitle:"📧 Email",
    waPhoneId:"Phone Number ID", waToken:"Access Token", waPhoneNum:"Numéro pro",
    waTokenPh:"EAAB...", waPhoneIdPh:"123456789012345", waPhoneNumPh:"+213XXXXXXXXX",
    tgToken:"Bot Token", tgChatId:"Chat ID",
    tgTokenPh:"123456:ABCdef...", tgChatIdPh:"-1001234567890",
    igAccountId:"Account ID", igToken:"Access Token",
    igEmail:"Email lié", igAccountIdPh:"17841XXXXXXXXX",
    igTokenPh:"EAAB...", igEmailPh:"page@instagram.com",
    igPageType:"Type compte", igRecipientId:"Recipient IGSID (test)",
    igRecipientIdPh:"1234567890",
    igPageTypes:["Page Business","Créateur","Marque"],
    emailService:"Service", emailApiKey:"API Key",
    emailSender:"Email expéditeur", emailSenderName:"Nom expéditeur",
    emailApiKeyPh:"re_XX... ou host:port:user:pass", emailSenderPh:"no-reply@vipgopay.dz",
    emailSenderNamePh:"VipGoPay",
    saveInteg:"💾 Sauvegarder", integSaved:"✅ Sauvegardé",
    testNotif:"🧪 Tester", testSending:"Envoi...",
    emptyCredsErr:"⚠️ Entrez de vraies clés d'intégration",
    connected:"✅ Connecté", notConnected:"Non connecté",
    webhookTitle:"🔗 Webhook URL", webhookSecret:"🔑 Clé secrète",
    webhookNote:"Utilisez dans Meta Business Manager",
    dashTitle:"📊 Résumé", dashRevenue:"Revenus", dashOrders:"Commandes",
    dashTopProducts:"Top produits", dashTopWilayas:"Top wilayas",
    notifLoading:"Envoi...", notifNoPlatforms:"⚠️ Aucune plateforme",
    gamingHub:"📊 Statistiques",
    gamingWalletTitle:"💰 Résumé financier",
    gamingRevenue:"Revenus confirmés totaux",
    gamingPoints:"🏆 Points fidélité",
    gamingPointsRate:"1 point / 100 DZD",
    gamingTierTitle:"📊 Niveau boutique",
    gamingMonthly:"Commandes confirmées ce mois",
    gamingNextTierLabel:"Pour atteindre le niveau suivant",
    gamingTierDiscount:"réduction livraison",
    gamingTierMaxed:"🏆 Niveau maximum — Diamant!",
    gamingQuickTitle:"⚡ Commandes rapides (One-Click)",
    gamingAddShortcut:"+ Ajouter raccourci",
    gamingQuickName:"Nom produit / package",
    gamingQuickGameId:"Référence / note",
    gamingQuickProduct:"Produit lié",
    gamingRechargeBtn:"Commander ⚡",
    gamingDeleteShortcut:"Supprimer",
    gamingQuickModal:"Détails commande rapide",
    gamingQuickCustName:"Nom client *",
    gamingQuickCustPhone:"Téléphone *",
    gamingQuickConfirm:"Confirmer ⚡",
    gamingQuickCreated:"✅ Commande créée",
    twoFATitle:"🔒 Double authentification (2FA)",
    twoFAToggle:"Activer 2FA avant confirmation",
    twoFANoEmail:"Ajoutez votre email dans Paramètres d'abord",
    twoFAModal:"✉️ Code de vérification",
    twoFASent:"Code envoyé à",
    twoFACodePh:"000000",
    twoFAVerify:"Vérifier ✓",
    twoFAResend:"↩ Renvoyer",
    twoFADevHint:"Mode dev — Code:",
    twoFAWrongCode:"Code incorrect, réessayez",
    twoFASending:"Envoi en cours...",
    twoFAVerifying:"Vérification...",
    twoFASuccess:"✅ Vérifié — confirmation en cours...",
    uidLabel:"UID compte unique",
  },
  en: {
    dir:"ltr" as const, name:"English",
    nav:["📦 Inventory","💬 Chat","📋 Orders","📊 Analytics","⚙️ Settings"],
    loginTitle:"VipGoPay", loginSub:"The Algerian E-commerce Assistant",
    loginGoogleBtn:"Sign in with Google",
    loginChooseAccount:"Choose an account", loginAddAccount:"➕ Use another account",
    loginVerifying:"Verifying with Google...", loginEnterEmail:"Enter your email",
    loginEmailErr:"Enter a valid email", loginContinue:"Continue ⚡",
    loginBlockedDomain:"Domain not accepted (temporary email)",
    addBtn:"+ New Product", save:"Save", cancel:"Cancel", search:"Search...",
    pName:"Product Name *", pCat:"Category", pPrice:"Price (DZD) *",
    pStock:"Quantity", pCond:"Condition", pSpecs:"Specs / Notes",
    conditions:["New","Used","Kaba","Partially Damaged"],
    noProducts:"No products yet", addHint:"Click + to add",
    outOfStock:"Out of Stock", qty:"Qty:",
    totalP:"Products", availP:"Available", outP:"Out of Stock",
    bulkTitle:"Add Bulk Stock", bulkPh:"Quantity to add",
    chatStep1:"📦 Product to Test",
    chatDemoName:"Product Name *", chatDemoPrice:"Price (DZD) *", chatDemoSpecs:"Specs / Notes",
    chatDemoNamePh:"e.g. Samsung Galaxy A15", chatDemoPricePh:"e.g. 45000",
    chatDemoRequired:"This field is required",
    chatDemoStart:"Start Testing ⚡", chatDemoReset:"↩ Change Product",
    chatWelcome:"Welcome to", chatSub:"Test the AI in Algerian Darja",
    startBtn:"Start ⚡", newChat:"↩ New",
    inputPh:"Type your message...", active:"● Active",
    logoutBtn:"Logout 🚪", logoutQ:"Logout?",
    quick:["Price?","Available?","I want to order","Delivery?"],
    ordersTitle:"Orders", noOrders:"No orders yet",
    product:"Product:", pending:"Pending", confirmed:"Confirmed", cancelled:"Cancelled",
    confirm:"✅ Confirm", cancelOrder:"✕ Cancel",
    exportCSV:"📥 CSV", copied:"✅ Copied!", shareLabel:"Contact:",
    waMsg:"Hello {name},\nOrder {id} confirmed ✅\nProduct: {product}\nPrice: {price} DZD\nThank you!",
    filterAll:"All", filterPending:"Pending", filterConfirmed:"Confirmed", filterCancelled:"Cancelled",
    settingsTitle:"Settings", shopName:"🏪 Store Name",
    emailL:"📧 Email", shopType:"🗂️ Product Type",
    location:"📍 Location", hours:"🕐 Hours",
    officeD:"📦 Office Delivery (DZD)", homeD:"🏠 Home Delivery (DZD)",
    extra:"📝 Extra AI Instructions",
    shippingSection:"🚚 Shipping — 58 Wilayas",
    shippingAll:"All Wilayas", shippingCustom:"Custom Only",
    shippingSearch:"Search wilaya...",
    addRate:"+ Add Wilaya", rateWilaya:"Wilaya", rateOffice:"Office", rateHome:"Home",
    notifSection:"🔔 Notifications",
    enableNotif:"Enable", notifEnabled:"✅ Enabled", notifDenied:"🚫 Blocked",
    muteNotif:"Mute new order notifications",
    notifNewOrder:"New order!", notifOutStock:"⚠️ Out of Stock",
    model:"🤖 Model", theme:"🎨 Theme", dark:"🌙 Dark", light:"☀️ Light",
    lang:"🌐 Language", saved:"✅ Auto-saved",
    clearAll:"🗑️ Clear account data", clearQ:"Are you sure?",
    privacyBtn:"🔒 Privacy Policy", privacyTitle:"Privacy Policy — VipGoPay",
    privacyText:"📋 Data We Collect\nWe collect your email for account management. We collect product and order data that you enter in the app. No personal data is collected without your knowledge or consent.\n\n🔧 How We Use Your Data\nYour data is used exclusively to run app features: inventory management, orders, and notifications. No advertising or external commercial use.\n\n🤖 Artificial Intelligence (Gemini)\nConversations are sent to Google Gemini API to generate real-time responses. This data is subject to Google's privacy policy at policies.google.com.\n\n🔗 Integrations (WhatsApp · Telegram · Instagram · Email)\nYour API keys are stored locally in your browser (localStorage) only. They are transmitted to the server only when sending notifications.\n\n🛡️ Security\nAll communications are HTTPS encrypted. We cannot access your locally stored data. Never share your API keys with anyone.\n\n⚖️ Your Rights\nYou can delete all your data at any time via Settings → Clear Data. We do not sell or share your data with any third party.\n\n📧 Contact: contact@vipgopay.dz",
    acceptPrivacy:"Got it ✓", orderBanner:"New order recorded!",
    apiNote:"⚙️ API keys secured server-side only.",
    integSection:"🔗 Real Integrations", integNote:"Real credentials for live notifications.",
    waTitle:"💬 WhatsApp Business API", tgTitle:"✈️ Telegram Bot",
    igTitle:"📸 Instagram Direct (Meta API)", emailTitle:"📧 Email",
    waPhoneId:"Phone Number ID", waToken:"Permanent Access Token", waPhoneNum:"Business Phone",
    waTokenPh:"EAAB...", waPhoneIdPh:"123456789012345", waPhoneNumPh:"+213XXXXXXXXX",
    tgToken:"Bot Token", tgChatId:"Chat ID",
    tgTokenPh:"123456:ABCdef...", tgChatIdPh:"-1001234567890",
    igAccountId:"Business Account ID", igToken:"Access Token",
    igEmail:"Linked email", igAccountIdPh:"17841XXXXXXXXX",
    igTokenPh:"EAAB...", igEmailPh:"page@instagram.com",
    igPageType:"Account Type", igRecipientId:"Recipient IGSID (test)",
    igRecipientIdPh:"1234567890",
    igPageTypes:["Business Page","Creator Account","Personal Brand"],
    emailService:"Service", emailApiKey:"API Key",
    emailSender:"Sender Email", emailSenderName:"Sender Name",
    emailApiKeyPh:"re_XX... or host:port:user:pass", emailSenderPh:"no-reply@vipgopay.dz",
    emailSenderNamePh:"VipGoPay",
    saveInteg:"💾 Save", integSaved:"✅ Saved",
    testNotif:"🧪 Test Send", testSending:"Sending...",
    emptyCredsErr:"⚠️ Please enter real integration keys to enable sending",
    connected:"✅ Connected", notConnected:"Not connected",
    webhookTitle:"🔗 Webhook URL", webhookSecret:"🔑 Secret",
    webhookNote:"Use in Meta Business Manager",
    dashTitle:"📊 Sales Summary", dashRevenue:"Revenue", dashOrders:"Orders",
    dashTopProducts:"Top Products", dashTopWilayas:"Top Wilayas",
    notifLoading:"Sending...", notifNoPlatforms:"⚠️ No platforms configured",
    gamingHub:"📊 Analytics",
    gamingWalletTitle:"💰 Financial Summary",
    gamingRevenue:"Total confirmed revenue",
    gamingPoints:"🏆 Loyalty Points",
    gamingPointsRate:"1 point per 100 DZD",
    gamingTierTitle:"📊 Store Level",
    gamingMonthly:"Confirmed orders this month",
    gamingNextTierLabel:"To reach the next level",
    gamingTierDiscount:"shipping discount",
    gamingTierMaxed:"🏆 Max level — Diamond!",
    gamingQuickTitle:"⚡ Quick Orders (One-Click)",
    gamingAddShortcut:"+ Add Shortcut",
    gamingQuickName:"Product / Package Name",
    gamingQuickGameId:"Reference / Note",
    gamingQuickProduct:"Linked Product",
    gamingRechargeBtn:"Quick Order ⚡",
    gamingDeleteShortcut:"Delete",
    gamingQuickModal:"Quick Order Details",
    gamingQuickCustName:"Customer Name *",
    gamingQuickCustPhone:"Phone *",
    gamingQuickConfirm:"Confirm Order ⚡",
    gamingQuickCreated:"✅ Order created",
    twoFATitle:"🔒 Two-Factor Auth (2FA)",
    twoFAToggle:"Enable 2FA before confirming orders",
    twoFANoEmail:"Add your email in Settings first",
    twoFAModal:"✉️ Verification Code",
    twoFASent:"6-digit code sent to",
    twoFACodePh:"000000",
    twoFAVerify:"Verify ✓",
    twoFAResend:"↩ Resend",
    twoFADevHint:"Dev mode — Code:",
    twoFAWrongCode:"Wrong code, try again",
    twoFASending:"Sending code...",
    twoFAVerifying:"Verifying...",
    twoFASuccess:"✅ Verified — confirming order...",
    uidLabel:"Unique Account UID",
  }
} as const;

type Lang = keyof typeof LANGS;
type WilayaRate  = { wilaya:string; office:string; home:string };
type Config      = { shopName:string; shopType:string; location:string; hours:string; officeDesk:string; officeHome:string; extra:string; model:string; email:string; muteNotif:boolean; wilayaRates:WilayaRate[] };
type IntegConfig = {
  wa:       { phoneNumberId:string; accessToken:string; phoneNumber:string };
  tg:       { botToken:string; chatId:string };
  ig:       { accountId:string; accessToken:string; email:string; recipientId:string; pageType:string };
  emailSvc: { service:string; apiKey:string; senderEmail:string; senderName:string };
};
type Product      = { id:number; name:string; cat:string; price:number; stock:number; cond:string; specs:string };
export type Order = { id:string; cust:{name:string;phone:string;wilaya:string;commune:string}; product:string; productId:number; price:number; status:string; time:string };
type Msg          = { role:'user'|'assistant'; content:string; time:string };
type NotifyResult = { channel:string; ok:boolean; error?:string };
type NotifyStatus = { loading:boolean; results:NotifyResult[] };
type CustomerInfo = { name:string; phone:string; wilaya:string; commune:string };
type QuickOrder   = { id:string; gameName:string; gameId:string; productId:number|null; productName:string };

function ls<T>(k:string,d:T):T{try{return JSON.parse(localStorage.getItem(k)??"null")??d}catch{return d}}
function lss(k:string,v:unknown){localStorage.setItem(k,JSON.stringify(v))}
function emailKey(email:string){return email.toLowerCase().replace(/[^a-z0-9]/g,'_')}
function avatarColor(email:string){const c=["#06d6f5","#8b5cf6","#10b981","#f59e0b","#ef4444","#ec4899"];let h=0;for(const ch of email)h=(h*31+ch.charCodeAt(0))%c.length;return c[h]}

const THEMES={
  dark:{bg:'#05071a',surf:'#0a0d1f',surf2:'#0f1428',border:'#1a2040',acc:'#06d6f5',acc2:'#8b5cf6',text:'#e8eeff',muted:'#3d4f7a',sub:'#7a8fc4',ok:'#10b981',warn:'#f59e0b',err:'#ef4444',head:'#07090f'},
  light:{bg:'#f0f4ff',surf:'#ffffff',surf2:'#f5f7ff',border:'#dde4f5',acc:'#0284c7',acc2:'#7c3aed',text:'#0f172a',muted:'#94a3b8',sub:'#64748b',ok:'#059669',warn:'#d97706',err:'#dc2626',head:'#ffffff'}
};
const ES:Config={shopName:'VipGoPay',shopType:'إلكترونيات',location:'الجزائر',hours:'9:00-22:00',officeDesk:'400',officeHome:'600',extra:'',model:'gemini-2.5-flash',email:'',muteNotif:false,wilayaRates:[]};
const EI:IntegConfig={wa:{phoneNumberId:'',accessToken:'',phoneNumber:''},tg:{botToken:'',chatId:''},ig:{accountId:'',accessToken:'',email:'',recipientId:'',pageType:'Business Page'},emailSvc:{service:'resend',apiKey:'',senderEmail:'',senderName:''}};

const GoogleG=()=><svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;

export default function App(){
  const [lang,setLang]=useState<Lang>(()=>ls('sr_lang','ar'));
  const [tn,setTn]=useState<'dark'|'light'>(()=>ls('sr_theme','dark'));
  const T=LANGS[lang];const th={...THEMES.dark,...THEMES[tn]};
  const [appState,setAppState]=useState<'login'|'verifying'|'app'>(()=>localStorage.getItem('sr_active_email')?'app':'login');
  const [activeEmail,setActiveEmail]=useState<string>(()=>localStorage.getItem('sr_active_email')??"");
  const [showModal,setShowModal]=useState(false);
  const [addingAccount,setAddingAccount]=useState(false);
  const [customEmail,setCustomEmail]=useState('');
  const [customErr,setCustomErr]=useState('');
  const [verifyingEmail,setVerifyingEmail]=useState('');
  const [savedAccounts,setSavedAccounts]=useState<string[]>(()=>ls<string[]>('sr_accounts',[]));
  const [googleLoading,setGoogleLoading]=useState(false);
  const allAccounts=[...new Set([...DEFAULT_ACCOUNTS,...savedAccounts])];

  const triggerGoogleLogin=()=>{
    if(GOOGLE_CLIENT_ID&&window.google?.accounts?.oauth2){
      setGoogleLoading(true);
      const client=window.google.accounts.oauth2.initTokenClient({
        client_id:GOOGLE_CLIENT_ID,
        scope:'email profile',
        callback:(response)=>{
          setGoogleLoading(false);
          if(response.access_token){
            fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:`Bearer ${response.access_token}`}})
              .then(r=>r.json())
              .then((info:{email?:string})=>{if(info.email)selectAccount(info.email);else{setShowModal(true);if(allAccounts.length===0)setAddingAccount(true);}})
              .catch(()=>{setGoogleLoading(false);setShowModal(true);if(allAccounts.length===0)setAddingAccount(true);});
          }else{
            setShowModal(true);
            if(allAccounts.length===0)setAddingAccount(true);
          }
        },
      });
      client.requestAccessToken({prompt:'select_account'});
    }else{
      setShowModal(true);
      if(allAccounts.length===0)setAddingAccount(true);
    }
  };

  const selectAccount=(rawEmail:string)=>{
    const email=sanitizeEmail(rawEmail);
    setVerifyingEmail(email);setShowModal(false);setAddingAccount(false);
    setAppState('verifying');
    setTimeout(()=>{
      localStorage.setItem('sr_active_email',email);
      const next=[...new Set([...savedAccounts,email])];
      setSavedAccounts(next);lss('sr_accounts',next);
      setActiveEmail(email);setAppState('app');
    },1500);
  };

  const addCustom=()=>{
    const v=sanitizeEmail(customEmail);
    if(!v||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){setCustomErr(T.loginEmailErr);return;}
    if(isBlockedDomain(v)){setCustomErr(T.loginBlockedDomain);return;}
    selectAccount(v);
  };

  const handleLogout=()=>{localStorage.removeItem('sr_active_email');setActiveEmail('');setAppState('login');setShowModal(false);setAddingAccount(false);setCustomEmail('');setCustomErr('');};
  const S:React.CSSProperties={fontFamily:"'Segoe UI',system-ui,sans-serif",background:th.bg,minHeight:'100vh',direction:T.dir,color:th.text};

  if(appState==='verifying')return(
    <div style={{...S,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:60,height:60,border:`3px solid ${th.border}`,borderTop:`3px solid ${th.acc}`,borderRadius:'50%',margin:'0 auto 20px',animation:'spin 1s linear infinite'}}/>
        <div style={{fontSize:16,color:th.text,fontWeight:600,marginBottom:6}}>{T.loginVerifying}</div>
        <div style={{fontSize:13,color:th.acc}}>{verifyingEmail}</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(appState==='login')return(
    <div style={{...S,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:th.surf,border:`1px solid ${th.border}`,borderRadius:24,width:'100%',maxWidth:420,overflow:'hidden',boxShadow:`0 24px 64px rgba(0,0,0,0.6),0 0 0 1px ${th.acc}22`}}>
            <div style={{padding:'20px 20px 12px',borderBottom:`1px solid ${th.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}><GoogleG/><span style={{color:th.text,fontWeight:700,fontSize:16}}>{T.loginChooseAccount}</span></div>
              <div style={{color:th.muted,fontSize:12}}>vipgopay.dz</div>
            </div>
            <div style={{maxHeight:320,overflowY:'auto'}}>
              {allAccounts.map(email=>(
                <button key={email} onClick={()=>selectAccount(email)} style={{width:'100%',background:'none',border:'none',padding:'14px 20px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'background .15s'}} onMouseEnter={e=>(e.currentTarget.style.background=th.surf2)} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:avatarColor(email),display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff',flexShrink:0}}>{email[0].toUpperCase()}</div>
                  <div style={{textAlign:T.dir==='rtl'?'right':'left'}}><div style={{color:th.text,fontWeight:600,fontSize:14}}>{email.split('@')[0]}</div><div style={{color:th.muted,fontSize:12}}>{email}</div></div>
                </button>
              ))}
              {addingAccount?(
                <div style={{padding:'12px 20px 16px',borderTop:`1px solid ${th.border}`}}>
                  <input type="email" placeholder={T.loginEnterEmail} value={customEmail} onChange={e=>{setCustomEmail(e.target.value);setCustomErr('')}} onKeyDown={e=>e.key==='Enter'&&addCustom()} autoFocus style={{width:'100%',background:th.surf2,border:`1px solid ${customErr?th.err:th.border}`,borderRadius:10,padding:'10px 12px',color:th.text,fontFamily:'inherit',fontSize:14,outline:'none',boxSizing:'border-box' as const,marginBottom:8}}/>
                  {customErr&&<div style={{color:th.err,fontSize:12,marginBottom:8}}>⚠ {customErr}</div>}
                  <button onClick={addCustom} style={{width:'100%',background:`linear-gradient(135deg,${th.acc},${th.acc2})`,border:'none',color:'#fff',padding:'10px',borderRadius:10,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:14}}>{T.loginContinue}</button>
                </div>
              ):(
                <button onClick={()=>setAddingAccount(true)} style={{width:'100%',background:'none',border:'none',padding:'14px 20px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',color:th.acc,fontFamily:'inherit',fontSize:14,fontWeight:600,borderTop:`1px solid ${th.border}`}} onMouseEnter={e=>(e.currentTarget.style.background=th.surf2)} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:th.surf2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>➕</div>{T.loginAddAccount}
                </button>
              )}
            </div>
            <div style={{padding:'12px 20px',borderTop:`1px solid ${th.border}`,display:'flex',justifyContent:'flex-end'}}>
              <button onClick={()=>{setShowModal(false);setAddingAccount(false);setCustomEmail('');setCustomErr('');}} style={{background:'none',border:`1px solid ${th.border}`,color:th.sub,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:13}}>{T.cancel}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:80,height:80,background:`linear-gradient(135deg,${th.acc},${th.acc2})`,borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:42,margin:'0 auto 16px',boxShadow:`0 0 32px ${th.acc}44`}}>🛍️</div>
          <div style={{fontSize:28,fontWeight:900,color:th.text,marginBottom:4,letterSpacing:-0.5}}>{T.loginTitle}</div>
          <div style={{color:th.muted,fontSize:14}}>{T.loginSub}</div>
        </div>
        <div style={{background:th.surf,border:`1px solid ${th.border}`,borderRadius:20,padding:24,boxShadow:`0 8px 32px rgba(0,0,0,0.4),0 0 0 1px ${th.acc}11`}}>
          <button onClick={triggerGoogleLogin} disabled={googleLoading} style={{width:'100%',background:'#ffffff',border:'none',borderRadius:12,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'center',gap:10,cursor:googleLoading?'not-allowed':'pointer',fontFamily:'inherit',fontWeight:700,fontSize:15,color:'#3c4043',boxShadow:'0 2px 8px rgba(0,0,0,0.3)',opacity:googleLoading?0.8:1,transition:'all .2s'}} onMouseEnter={e=>{if(!googleLoading)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.4)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)'}}>
            {googleLoading
              ?<><div style={{width:18,height:18,border:'2px solid #dadce0',borderTop:'2px solid #4285f4',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0}}/><span style={{color:'#3c4043'}}>جاري التحقق...</span></>
              :<><GoogleG/>{T.loginGoogleBtn}</>}
          </button>
          {!GOOGLE_CLIENT_ID&&<div style={{marginTop:10,background:'#1a1a2e',border:'1px solid #4285f455',borderRadius:9,padding:'8px 12px',fontSize:11,color:'#8ab4f8',lineHeight:1.7,textAlign:'center'}}>
            💡 لتفعيل تسجيل الدخول الحقيقي عبر Google، أضف متغير <code style={{background:'#ffffff15',borderRadius:4,padding:'1px 5px',fontFamily:'monospace'}}>VITE_GOOGLE_CLIENT_ID</code> في إعدادات المشروع
          </div>}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:20}}>
          {(['ar','fr','en'] as Lang[]).map(l=><button key={l} onClick={()=>{setLang(l);lss('sr_lang',l)}} style={{background:lang===l?th.acc:th.surf,border:`1px solid ${lang===l?th.acc:th.border}`,color:lang===l?'#fff':th.muted,padding:'5px 12px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:lang===l?700:400}}>{l.toUpperCase()}</button>)}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
    </div>
  );

  return<AppContent key={activeEmail} email={activeEmail} onLogout={handleLogout} lang={lang} setLang={l=>{setLang(l);lss('sr_lang',l)}} tn={tn} setTn={t=>{setTn(t);lss('sr_theme',t)}}/>;
}

const TIPS: Record<string,string> = {
  shopName:"اسم متجرك الرسمي. سيظهر في رسائل WhatsApp وفي محادثات الذكاء الاصطناعي مع الزبائن.",
  email:"بريدك الإلكتروني لاستقبال إشعارات OTP وتفعيل التحقق الثنائي (2FA) عند تأكيد الطلبيات.",
  shopType:"نوع المنتجات التي تبيعها (مثال: إلكترونيات، ملابس، إكسسوارات...). يُساعد الذكاء الاصطناعي على تكييف ردوده.",
  location:"عنوان متجرك أو مدينتك. يُستخدم في الردود التلقائية عند سؤال الزبائن عن الموقع.",
  hours:"أوقات عمل متجرك. مثال: 9:00-22:00. يُخبر الذكاء الاصطناعي الزبائن بها تلقائياً.",
  officeDesk:"سعر التوصيل لمكاتب البريد السريع (يالدس، زيدوم...) بالدينار الجزائري.",
  officeHome:"سعر التوصيل للمنزل مباشرة بالدينار الجزائري.",
  extra:"تعليمات خاصة للذكاء الاصطناعي. مثال:\n• لا تعطِ أسعاراً قبل التحقق من المخزون\n• أخبر الزبائن بعروض الجمعة\n• ردّ فقط باللغة العربية",
  model:"نموذج الذكاء الاصطناعي:\n• Gemini 2.5 Flash ⚡ — سريع وفعّال للاستخدام اليومي المكثف\n• Gemini 2.5 Pro 🏆 — أدق وأقوى للمحادثات المعقدة",
  waPhoneId:"Phone Number ID الخاص برقم WhatsApp Business.\n📍 للحصول عليه:\n1. اذهب إلى Meta for Developers\n2. WhatsApp → API Setup\n3. انسخ رقم الـ Phone Number ID\nمثال: 123456789012345",
  waToken:"Access Token الدائم لحساب WhatsApp Business API.\n📍 للحصول عليه:\n1. Meta for Developers → WhatsApp → API Setup\n2. انقر على Generate token → اختر Never Expire\n⚠️ احفظه بأمان ولا تُشاركه مع أحد",
  waPhoneNum:"رقم هاتف WhatsApp Business بالصيغة الدولية.\nمثال: +213550000000\n(يبدأ بـ + ثم كود البلد 213)",
  tgToken:"Bot Token الخاص ببوت Telegram.\n📍 لإنشاء بوت جديد:\n1. افتح @BotFather في تيليغرام\n2. أرسل /newbot واتبع التعليمات\n3. انسخ الـ Token\nمثال: 123456789:ABCdefGHIjkl",
  tgChatId:"معرّف القناة أو المجموعة لاستقبال الإشعارات.\n📍 للحصول عليه:\n• أضف @userinfobot للمجموعة ثم أرسل أي رسالة\n• أو افتح: api.telegram.org/bot{TOKEN}/getUpdates\nمثال: -1001234567890",
  igAccountId:"معرّف حساب Instagram Business.\n📍 تجده في:\nMeta Business Manager → Instagram Accounts → Account ID\nمثال: 17841000000000",
  igToken:"Access Token لحساب Instagram Business.\n📍 احصل عليه من:\nMeta for Developers → Instagram → API with Instagram Login\n⚠️ يجب أن يكون الحساب من نوع Business أو Creator",
  igEmail:"البريد الإلكتروني المرتبط بصفحة Instagram Business الخاصة بك.",
  igRecipientId:"IGSID للاختبار — معرّف المستخدم الذي ستُرسل له رسائل الاختبار.\n📍 احصل عليه من:\nMeta Graph API Explorer",
  emailApiKey:"مفتاح API لخدمة الإيميل المختارة:\n• Resend: resend.com/api-keys (re_XXXXXX)\n• Mailjet: app.mailjet.com/account/apikeys\n• SendGrid: app.sendgrid.com/settings/api_keys\n• SMTP: أدخل بالصيغة: host:port:email:password",
  emailSender:"بريد المرسل — من أين ستُرسل رسائلك للزبائن.\nيجب أن يكون مُفعّلاً في خدمة الإيميل.\nمثال: no-reply@متجرك.dz",
  emailSenderName:"الاسم الذي يظهر للزبون في صندوق الوارد.\nمثال: متجر الإلكترونيات أو VipGoPay",
};

function AppContent({email,onLogout,lang,setLang,tn,setTn}:{email:string;onLogout:()=>void;lang:Lang;setLang:(l:Lang)=>void;tn:'dark'|'light';setTn:(t:'dark'|'light')=>void}){
  const K=(key:string)=>`sr_${emailKey(email)}_${key}`;
  const T=LANGS[lang];const th={...THEMES.dark,...THEMES[tn]};
  const uid=getOrCreateUID(email);

  const [tab,setTab]=useState(0);
  const [prods,setProds]=useState<Product[]>(()=>ls(K('prods'),[]));
  const [cfg,setCfg]=useState<Config>(()=>({...ES,...ls<Partial<Config>>(K('cfg'),{})}));
  const [orders,setOrders]=useState<Order[]>(()=>ls(K('orders'),[]));
  const [integCfg,setIntegCfg]=useState<IntegConfig>(()=>{const s=ls<Partial<IntegConfig>>(K('integ'),{});return{wa:{...EI.wa,...(s.wa??{})},tg:{...EI.tg,...(s.tg??{})},ig:{...EI.ig,...(s.ig??{})},emailSvc:{...EI.emailSvc,...(s.emailSvc??{})}};});
  const [quickOrders,setQuickOrders]=useState<QuickOrder[]>(()=>ls(K('quick'),[]));
  const [twoFAEnabled,setTwoFAEnabled]=useState<boolean>(()=>ls(K('2fa'),false));
  const [dataLoading,setDataLoading]=useState(true);
  const [orderFilter,setOrderFilter]=useState<'all'|'pending'|'confirmed'|'cancelled'>('all');

  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState<number|null>(null);
  const [form,setForm]=useState({name:'',cat:'',price:'',stock:'',cond:'',specs:''});
  const [search,setSearch]=useState('');
  const [bulk,setBulk]=useState<number|null>(null);
  const [bulkQ,setBulkQ]=useState('');

  const [chatStep,setChatStep]=useState<'product'|'chat'>('product');
  const [demoProduct,setDemoProduct]=useState({name:'',price:'',specs:''});
  const [demoErr,setDemoErr]=useState('');
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [inp,setInp]=useState('');
  const [aiLoading,setAiLoading]=useState(false);
  const [banner,setBanner]=useState<Order|null>(null);
  const [showPrivacy,setShowPrivacy]=useState(false);
  const [copyFb,setCopyFb]=useState<string|null>(null);
  const [notifPerm,setNotifPerm]=useState<NotificationPermission>(()=>typeof Notification!=='undefined'?Notification.permission:'default');
  const [newRate,setNewRate]=useState<WilayaRate>({wilaya:'',office:'',home:''});
  const [integSaved,setIntegSaved]=useState<Record<string,boolean>>({});
  const [expandInteg,setExpandInteg]=useState<string|null>(null);
  const [copiedWh,setCopiedWh]=useState(false);
  const [showSecret,setShowSecret]=useState(false);
  const [notifyStatus,setNotifyStatus]=useState<Record<string,NotifyStatus>>({});
  const [emptyCredsErr,setEmptyCredsErr]=useState(false);
  const [testLoading,setTestLoading]=useState(false);
  const [shippingView,setShippingView]=useState<'custom'|'all'>('custom');
  const [shippingSearch,setShippingSearch]=useState('');

  const [showOTPModal,setShowOTPModal]=useState(false);
  const [pendingOrderId,setPendingOrderId]=useState<string|null>(null);
  const [otpInput,setOtpInput]=useState('');
  const [otpDevCode,setOtpDevCode]=useState('');
  const [otpStatus,setOtpStatus]=useState<'idle'|'sending'|'sent'|'verifying'|'verified'|'error'>('idle');
  const [otpErrMsg,setOtpErrMsg]=useState('');

  const [quickModal,setQuickModal]=useState<QuickOrder|null>(null);
  const [quickCust,setQuickCust]=useState({name:'',phone:''});
  const [quickCustErr,setQuickCustErr]=useState('');
  const [quickSuccess,setQuickSuccess]=useState(false);
  const [newQuick,setNewQuick]=useState({gameName:'',gameId:'',productId:''});
  const [showQuickForm,setShowQuickForm]=useState(false);
  const [activeTip,setActiveTip]=useState<string|null>(null);
  const InfoTip=({k}:{k:string})=>TIPS[k]?<button type="button" onClick={()=>setActiveTip(k)} style={{background:'none',border:`1px solid ${th.acc}55`,color:th.acc,borderRadius:'50%',width:17,height:17,fontSize:10,cursor:'pointer',padding:0,marginInlineStart:6,display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:900,flexShrink:0,lineHeight:1,verticalAlign:'middle'}}>i</button>:null;

  const [shopId]=useState<string>(()=>{const ex=localStorage.getItem(K('shopid'));if(ex)return ex;const id=Math.random().toString(36).slice(2,10).toUpperCase();localStorage.setItem(K('shopid'),id);return id;});
  const [webhookSecret]=useState<string>(()=>{const ex=localStorage.getItem(K('whsec'));if(ex)return ex;const b=new Uint8Array(16);crypto.getRandomValues(b);const s=Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(K('whsec'),s);return s;});

  const botRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    (async()=>{
      try{
        const[pr,or,st]=await Promise.all([fetch('/api/products').then(r=>r.json()),fetch('/api/orders').then(r=>r.json()),fetch('/api/store-settings').then(r=>r.json())]);
        if(Array.isArray(pr)&&pr.length>0)setProds(pr as Product[]);
        if(Array.isArray(or)&&or.length>0)setOrders(or as Order[]);
        if(st&&typeof st==='object'&&!Array.isArray(st)&&Object.keys(st).length>0)setCfg(c=>({...c,...(st as Partial<Config>)}));
      }catch{}
      setDataLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const cfgTimer=useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(()=>{lss(K('cfg'),cfg);clearTimeout(cfgTimer.current);cfgTimer.current=setTimeout(()=>{fetch('/api/store-settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)}).catch(()=>{});},2000);},[cfg]);
  useEffect(()=>{lss(K('prods'),prods);},[prods]);
  useEffect(()=>{lss(K('orders'),orders);},[orders]);
  useEffect(()=>{lss(K('integ'),integCfg);},[integCfg]);
  useEffect(()=>{lss(K('quick'),quickOrders);},[quickOrders]);
  useEffect(()=>{lss(K('2fa'),twoFAEnabled);},[twoFAEnabled]);
  useEffect(()=>{botRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  const sendNotif=(title:string,body:string)=>{if(cfg.muteNotif||typeof Notification==='undefined'||Notification.permission!=='granted')return;new Notification(title,{body,icon:'/favicon.ico'});};
  const nowT=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const webhookUrl=`${window.location.origin}/api/webhooks/store?user=${encodeURIComponent(uid)}&shop=${shopId}`;
  const hasAnyCreds=()=>integCfg.wa.accessToken.trim()||integCfg.tg.botToken.trim()||integCfg.ig.accessToken.trim()||integCfg.emailSvc.apiKey.trim();

  const saveP=useCallback(async()=>{
    if(!form.name||!form.price)return;
    const p={name:form.name,cat:form.cat,price:Number(form.price),stock:Number(form.stock)||0,cond:form.cond||T.conditions[0],specs:form.specs};
    try{if(editId){const r=await fetch(`/api/products/${editId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const u=await r.json() as Product;setProds(prev=>prev.map(x=>x.id===editId?u:x));}else{const r=await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const c=await r.json() as Product;setProds(prev=>[...prev,c]);}}catch{}
    setForm({name:'',cat:'',price:'',stock:'',cond:'',specs:''});setShowForm(false);setEditId(null);
  },[form,editId,T.conditions]);

  const delP=(id:number)=>{setProds(p=>p.filter(x=>x.id!==id));fetch(`/api/products/${id}`,{method:'DELETE'}).catch(()=>{});};
  const editP=(p:Product)=>{setForm({...p,price:String(p.price),stock:String(p.stock)});setEditId(p.id);setShowForm(true);};
  const chgStock=async(id:number,d:number)=>{
    let n='';setProds(p=>p.map(x=>{if(x.id!==id)return x;const ns=Math.max(0,x.stock+d);if(ns===0&&x.stock>0)n=x.name;return{...x,stock:ns};}));
    if(n)setTimeout(()=>sendNotif(T.notifOutStock,n),0);
    const prod=prods.find(x=>x.id===id);
    if(prod)fetch(`/api/products/${id}/stock`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({stock:Math.max(0,prod.stock+d)})}).catch(()=>{});
  };
  const fProds=prods.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||(p.cat||'').toLowerCase().includes(search.toLowerCase()));

  const startChat=()=>{
    if(!demoProduct.name.trim()){setDemoErr(T.chatDemoRequired);return;}
    if(!demoProduct.price.trim()||isNaN(Number(demoProduct.price))){setDemoErr(T.chatDemoRequired);return;}
    const intro=`مرحباً! 👋\nأنا المساعد ديال ${cfg.shopName}\nقدّاملي:\n📦 ${demoProduct.name}\n💰 ${Number(demoProduct.price).toLocaleString()} DZD${demoProduct.specs?`\n📝 ${demoProduct.specs}`:''}\nواش تحب تعرف؟`;
    setMsgs([{role:'assistant',content:intro,time:nowT()}]);
    setChatStep('chat');setDemoErr('');
  };
  const send=async()=>{
    if(!inp.trim()||aiLoading)return;
    const um:Msg={role:'user',content:inp.trim(),time:nowT()};
    const upd=[...msgs,um];setMsgs(upd);setInp('');setAiLoading(true);
    try{
      const demoProd=[{id:0,name:demoProduct.name,price:Number(demoProduct.price),stock:99,cond:'',specs:demoProduct.specs}];
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:cfg.model,messages:upd.map(m=>({role:m.role,content:m.content})),storeConfig:cfg,productsList:prods.length>0?prods:demoProd})});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();const raw:string=d.reply||'';
      const clean=raw.replace(/%%JSON\s*\{.*?\}\s*%%/gs,'').trim();
      setMsgs([...upd,{role:'assistant',content:clean||'واش تحب تعرف؟',time:nowT()}]);
    }catch(err){setMsgs(p=>[...p,{role:'assistant',content:'⚠️ خطأ: '+(err instanceof Error?err.message:'Unknown'),time:''}]);}
    setAiLoading(false);
  };

  const sendNotifications=async(order:Order)=>{
    setNotifyStatus(s=>({...s,[order.id]:{loading:true,results:[]}}));
    try{
      const r=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order,integrations:{wa:integCfg.wa,tg:integCfg.tg,ig:integCfg.ig,emailSvc:integCfg.emailSvc},customerEmail:integCfg.ig.email||cfg.email||undefined})});
      const d=await r.json() as{results?:NotifyResult[];warning?:string;error?:string};
      if(!r.ok)throw new Error(d.error??`HTTP ${r.status}`);
      setNotifyStatus(s=>({...s,[order.id]:{loading:false,results:d.results??[]}}));
    }catch(err){setNotifyStatus(s=>({...s,[order.id]:{loading:false,results:[{channel:'error',ok:false,error:err instanceof Error?err.message:'Unknown'}]}}));}
  };
  const updOrder=(id:string,s:string)=>{
    const target=orders.find(o=>o.id===id);
    setOrders(p=>p.map(o=>o.id===id?{...o,status:s}:o));
    fetch(`/api/orders/${id}/status`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})}).catch(()=>{});
    if(s==='confirmed'&&target)sendNotifications({...target,status:'confirmed'});
  };
  const requestOTP=async()=>{
    if(!cfg.email.trim()){setOtpErrMsg(T.twoFANoEmail);setOtpStatus('error');return;}
    setOtpStatus('sending');setOtpErrMsg('');setOtpDevCode('');setOtpInput('');
    try{
      const r=await fetch('/api/auth/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:cfg.email.trim()})});
      const d=await r.json() as{success?:boolean;devCode?:string;error?:string};
      if(r.ok){setOtpStatus('sent');if(d.devCode)setOtpDevCode(String(d.devCode));}
      else{setOtpStatus('error');setOtpErrMsg(d.error??`HTTP ${r.status}`);}
    }catch(e){setOtpStatus('error');setOtpErrMsg(e instanceof Error?e.message:'Network error');}
  };
  const verifyOTP=async()=>{
    if(!pendingOrderId)return;
    setOtpStatus('verifying');setOtpErrMsg('');
    try{
      const r=await fetch('/api/auth/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:cfg.email.trim(),code:otpInput.trim()})});
      const d=await r.json() as{success?:boolean;error?:string};
      if(r.ok&&d.success){
        setOtpStatus('verified');
        setTimeout(()=>{updOrder(pendingOrderId,'confirmed');setShowOTPModal(false);setPendingOrderId(null);setOtpInput('');setOtpDevCode('');setOtpStatus('idle');},800);
      }else{setOtpStatus('error');setOtpErrMsg(d.error??T.twoFAWrongCode);}
    }catch(e){setOtpStatus('error');setOtpErrMsg(e instanceof Error?e.message:'Network error');}
  };
  const handleConfirmOrder=(id:string)=>{
    if(twoFAEnabled&&cfg.email.trim()){setPendingOrderId(id);setShowOTPModal(true);requestOTP();}
    else updOrder(id,'confirmed');
  };
  const buildMsg=(o:Order)=>T.waMsg.replace('{name}',o.cust.name).replace('{id}',o.id).replace('{product}',o.product).replace('{price}',String(o.price)).replace('{wilaya}',o.cust.wilaya);
  const shareWA=(o:Order)=>{const p=o.cust.phone.replace(/\D/g,'');window.open(`https://wa.me/${p.startsWith('0')?'213'+p.slice(1):p}?text=${encodeURIComponent(buildMsg(o))}`,'_blank');};
  const shareMsg=(o:Order)=>{navigator.clipboard.writeText(buildMsg(o));setCopyFb(o.id+'_m');setTimeout(()=>setCopyFb(null),2000);window.open('https://www.messenger.com/new','_blank');};
  const shareIG=(o:Order)=>{navigator.clipboard.writeText(buildMsg(o));setCopyFb(o.id+'_ig');setTimeout(()=>setCopyFb(null),2000);window.open('https://www.instagram.com/direct/new/','_blank');};
  const exportCSV=()=>{const h=['ID','Name','Phone','Wilaya','Commune','Product','Price','Status','Time'];const rows=orders.map(o=>[o.id,o.cust.name,o.cust.phone,o.cust.wilaya,o.cust.commune,o.product,o.price,o.status,o.time]);const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download=`orders-${Date.now()}.csv`;a.click();};
  const filteredOrders=orderFilter==='all'?orders:orders.filter(o=>o.status===orderFilter);

  const createQuickOrder=()=>{
    if(!quickCust.name.trim()){setQuickCustErr(lang==='fr'?'Champ obligatoire':lang==='en'?'Required field':'الحقل مطلوب');return;}
    if(!isValidAlgerianPhone(quickCust.phone)){setQuickCustErr(lang==='fr'?'Numéro invalide (0XXXXXXXXX)':lang==='en'?'Invalid phone (0XXXXXXXXX)':'رقم غير صحيح (0XXXXXXXXX)');return;}
    if(!quickModal)return;
    const linkedProd=prods.find(p=>p.id===quickModal.productId);
    const o:Order={id:`ORD-${Date.now()}`,cust:{name:quickCust.name.trim(),phone:quickCust.phone.trim(),wilaya:'',commune:''},product:linkedProd?.name??quickModal.productName,productId:quickModal.productId??0,price:linkedProd?.price??0,status:'pending',time:new Date().toLocaleString()};
    fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)}).then(r=>r.json()).then(s=>setOrders(p=>[s as Order,...p])).catch(()=>setOrders(p=>[o,...p]));
    setQuickSuccess(true);setTimeout(()=>{setQuickModal(null);setQuickCust({name:'',phone:''});setQuickCustErr('');setQuickSuccess(false);},1200);
  };

  const addRate=()=>{if(!newRate.wilaya)return;setCfg(c=>({...c,wilayaRates:[...(c.wilayaRates||[]).filter(r=>r.wilaya!==newRate.wilaya),newRate]}));setNewRate({wilaya:'',office:'',home:''});};
  const delRate=(w:string)=>setCfg(c=>({...c,wilayaRates:(c.wilayaRates||[]).filter(r=>r.wilaya!==w)}));
  const shippingWilayas=WILAYAS.filter(w=>w.toLowerCase().includes(shippingSearch.toLowerCase()));
  const getRate=(w:string)=>(cfg.wilayaRates||[]).find(r=>r.wilaya===w);

  const saveInteg=(key:keyof IntegConfig)=>{lss(K('integ'),integCfg);setIntegSaved(s=>({...s,[key]:true}));setTimeout(()=>setIntegSaved(s=>({...s,[key]:false})),3000);};
  const testSend=async()=>{
    if(!hasAnyCreds()){setEmptyCredsErr(true);setTimeout(()=>setEmptyCredsErr(false),4000);return;}
    setTestLoading(true);
    const testOrder:Order={id:'TEST-001',cust:{name:'زبون اختبار',phone:'0550000000',wilaya:'الجزائر',commune:''},product:'Test Product',productId:0,price:500,status:'confirmed',time:new Date().toLocaleString()};
    await sendNotifications(testOrder);setTestLoading(false);
  };
  const isConn=(key:keyof IntegConfig)=>{const v=integCfg[key] as Record<string,string>;return Object.values(v).some(x=>x.trim().length>0);};

  const confirmedOrders=orders.filter(o=>o.status==='confirmed');
  const nowDate=new Date();
  const monthlyConf=confirmedOrders.filter(o=>{try{const d=new Date(o.time);return d.getMonth()===nowDate.getMonth()&&d.getFullYear()===nowDate.getFullYear();}catch{return false;}});
  const totalRevenue=confirmedOrders.reduce((s,o)=>s+(o.price||0),0);
  const loyaltyPoints=Math.floor(totalRevenue/100);
  const monthCount=monthlyConf.length;
  const curTier=getTierForCount(monthCount);
  const nextTier=getNextTier(monthCount);
  const tPct=tierProgressPct(monthCount);

  const CARD:React.CSSProperties={background:th.surf,border:`1px solid ${th.border}`,borderRadius:16,padding:14,marginBottom:10,boxShadow:'0 2px 12px rgba(0,0,0,0.25)'};
  const I=(err?:boolean):React.CSSProperties=>({width:'100%',background:th.surf2,border:`1px solid ${err?th.err:th.border}`,borderRadius:10,padding:'10px 12px',color:th.text,fontFamily:'inherit',fontSize:14,boxSizing:'border-box' as const,outline:'none'});
  const LB:React.CSSProperties={color:th.muted,fontSize:12,display:'block',marginBottom:4,fontWeight:600};
  const BTN=(v='primary'):React.CSSProperties=>({background:v==='primary'?`linear-gradient(135deg,${th.acc},${th.acc2})`:v==='danger'?th.err:'transparent',border:v==='muted'?`1px solid ${th.border}`:'none',color:v==='muted'?th.sub:'#fff',padding:'10px 16px',borderRadius:10,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13,boxShadow:v==='primary'?`0 0 16px ${th.acc}33`:'none'});
  const BDG=(c:string):React.CSSProperties=>({background:`${c}22`,color:c,fontSize:11,padding:'3px 9px',borderRadius:20,display:'inline-block',border:`1px solid ${c}33`});
  const PILL=(active:boolean):React.CSSProperties=>({background:active?th.acc:th.surf2,border:`1px solid ${active?th.acc:th.border}`,color:active?'#fff':th.sub,padding:'5px 13px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:active?700:400,boxShadow:active?`0 0 10px ${th.acc}44`:'none'});

  if(dataLoading)return(<div style={{fontFamily:'inherit',background:th.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{width:48,height:48,border:`3px solid ${th.border}`,borderTop:`3px solid ${th.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}/><div style={{color:th.muted,fontSize:14}}>Loading...</div></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:th.bg,minHeight:'100vh',color:th.text,direction:T.dir}}>
      {emptyCredsErr&&<div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:`linear-gradient(135deg,${th.err}cc,#7f0000cc)`,border:`1px solid ${th.err}`,borderRadius:14,padding:'12px 20px',zIndex:999,color:'#fff',fontWeight:700,fontSize:13,backdropFilter:'blur(8px)',boxShadow:`0 8px 32px rgba(239,68,68,0.4)`,maxWidth:'90vw',textAlign:'center'}}>{T.emptyCredsErr}</div>}
      {banner&&<div style={{position:'fixed',top:64,left:'50%',transform:'translateX(-50%)',background:th.surf,border:`1px solid ${th.ok}55`,borderRadius:14,padding:'11px 18px',zIndex:999,display:'flex',gap:10,alignItems:'center',boxShadow:`0 8px 30px rgba(0,0,0,0.6),0 0 0 1px ${th.ok}33`,maxWidth:'90vw'}}>
        <span style={{fontSize:22}}>🛒</span>
        <div><div style={{color:th.ok,fontWeight:700,fontSize:13}}>{T.orderBanner}</div><div style={{color:th.muted,fontSize:12}}>{banner.cust.name} — {banner.product}</div></div>
      </div>}
      {showPrivacy&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'flex-end'}}>
        <div style={{background:th.surf,width:'100%',borderRadius:'20px 20px 0 0',padding:20,maxHeight:'80vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h3 style={{margin:0,color:th.text}}>{T.privacyTitle}</h3><button onClick={()=>setShowPrivacy(false)} style={{background:th.surf2,border:'none',color:th.muted,width:30,height:30,borderRadius:8,cursor:'pointer'}}>✕</button></div>
          <p style={{color:th.sub,fontSize:13,lineHeight:1.9,marginBottom:20,whiteSpace:'pre-line'}}>{T.privacyText}</p>
          <button onClick={()=>setShowPrivacy(false)} style={{...BTN('primary'),width:'100%',padding:13}}>{T.acceptPrivacy}</button>
        </div>
      </div>}
      {showOTPModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:th.surf,border:`1px solid ${th.acc}55`,borderRadius:20,padding:24,width:'100%',maxWidth:380,boxShadow:`0 24px 64px rgba(0,0,0,0.6),0 0 0 1px ${th.acc}22`}}>
            <div style={{textAlign:'center',marginBottom:18}}>
              <div style={{fontSize:40,marginBottom:8}}>🔒</div>
              <h3 style={{margin:'0 0 6px',color:th.text,fontSize:16}}>{T.twoFAModal}</h3>
              {(otpStatus==='sent'||otpStatus==='verifying'||otpStatus==='verified')&&cfg.email&&<p style={{color:th.muted,fontSize:12,margin:0}}>{T.twoFASent}<br/><strong style={{color:th.acc}}>{cfg.email}</strong></p>}
            </div>
            {otpStatus==='sending'&&<div style={{textAlign:'center',color:th.muted,padding:'20px 0'}}><div style={{width:32,height:32,border:`2px solid ${th.border}`,borderTop:`2px solid ${th.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 10px'}}/>{T.twoFASending}</div>}
            {otpStatus==='verified'&&<div style={{textAlign:'center',color:th.ok,padding:'20px 0',fontWeight:700,fontSize:15}}>{T.twoFASuccess}</div>}
            {otpStatus==='error'&&<div style={{background:`${th.err}15`,border:`1px solid ${th.err}33`,borderRadius:10,padding:'10px 14px',color:th.err,fontSize:13,marginBottom:14,textAlign:'center'}}>{otpErrMsg}</div>}
            {(otpStatus==='sent'||otpStatus==='verifying'||otpStatus==='error')&&<>
              <div style={{textAlign:'center',marginBottom:14}}>
                <input type="text" inputMode="numeric" maxLength={6} placeholder={T.twoFACodePh} value={otpInput} onChange={e=>setOtpInput(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&otpInput.length===6&&verifyOTP()}
                  style={{...I(otpStatus==='error'&&!!otpInput),textAlign:'center',fontSize:28,letterSpacing:10,fontWeight:900,padding:'12px 0',color:th.acc}}/>
              </div>
              {otpDevCode&&<div style={{background:`${th.warn}15`,border:`1px solid ${th.warn}33`,borderRadius:10,padding:'9px 14px',textAlign:'center',marginBottom:14}}>
                <div style={{color:th.warn,fontSize:11,marginBottom:3,fontWeight:600}}>{T.twoFADevHint}</div>
                <div style={{color:th.warn,fontSize:24,fontWeight:900,letterSpacing:8}}>{otpDevCode}</div>
              </div>}
              <button onClick={verifyOTP} disabled={otpInput.length!==6||otpStatus==='verifying'} style={{...BTN('primary'),width:'100%',padding:12,marginBottom:8,fontSize:14,opacity:otpInput.length===6?1:0.5}}>{otpStatus==='verifying'?T.twoFAVerifying:T.twoFAVerify}</button>
              <button onClick={()=>{setOtpStatus('idle');requestOTP();}} style={{...BTN('muted'),width:'100%',padding:10,fontSize:13}}>{T.twoFAResend}</button>
            </>}
            <button onClick={()=>{setShowOTPModal(false);setPendingOrderId(null);setOtpInput('');setOtpDevCode('');setOtpStatus('idle');setOtpErrMsg('');}} style={{...BTN('muted'),width:'100%',padding:9,marginTop:8,fontSize:12,color:th.muted}}>{T.cancel}</button>
          </div>
        </div>
      )}
      {quickModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:th.surf,border:`1px solid ${th.acc}55`,borderRadius:20,padding:24,width:'100%',maxWidth:380}}>
            {quickSuccess?<div style={{textAlign:'center',padding:'30px 0'}}><div style={{fontSize:50,marginBottom:12}}>✅</div><div style={{color:th.ok,fontWeight:700,fontSize:16}}>{T.gamingQuickCreated}</div></div>:<>
              <h3 style={{margin:'0 0 4px',color:th.text}}>{T.gamingQuickModal}</h3>
              <div style={{background:th.surf2,borderRadius:10,padding:'10px 12px',marginBottom:16}}>
                <div style={{color:th.acc,fontWeight:700}}>{quickModal.gameName}</div>
                {quickModal.gameId&&<div style={{color:th.muted,fontSize:12}}>Réf: {quickModal.gameId}</div>}
                {quickModal.productName&&<div style={{color:th.muted,fontSize:12}}>{quickModal.productName}</div>}
              </div>
              <div style={{marginBottom:10}}><label style={LB}>{T.gamingQuickCustName}</label><input value={quickCust.name} onChange={e=>{setQuickCust(c=>({...c,name:e.target.value}));setQuickCustErr('');}} style={I(!!quickCustErr&&!quickCust.name.trim())}/></div>
              <div style={{marginBottom:12}}><label style={LB}>{T.gamingQuickCustPhone}</label><input value={quickCust.phone} placeholder="0XXXXXXXXX" onChange={e=>{setQuickCust(c=>({...c,phone:e.target.value}));setQuickCustErr('');}} style={I(!!quickCustErr&&!isValidAlgerianPhone(quickCust.phone))}/></div>
              {quickCustErr&&<div style={{color:th.err,fontSize:12,marginBottom:12}}>⚠ {quickCustErr}</div>}
              <button onClick={createQuickOrder} style={{...BTN('primary'),width:'100%',padding:12,marginBottom:8}}>{T.gamingQuickConfirm}</button>
              <button onClick={()=>{setQuickModal(null);setQuickCust({name:'',phone:''});setQuickCustErr('');}} style={{...BTN('muted'),width:'100%',padding:9,fontSize:12}}>{T.cancel}</button>
            </>}
          </div>
        </div>
      )}

      {activeTip&&TIPS[activeTip]&&(
        <div onClick={()=>setActiveTip(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(5px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:th.surf,border:`1px solid ${th.acc}55`,borderRadius:18,padding:'22px 20px',width:'100%',maxWidth:370,boxShadow:`0 0 40px ${th.acc}22`,maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{color:th.acc,fontWeight:800,fontSize:14,marginBottom:12}}>ℹ️ معلومات</div>
            <div style={{color:th.text,fontSize:13,lineHeight:2,whiteSpace:'pre-line'}}>{TIPS[activeTip]}</div>
            <button onClick={()=>setActiveTip(null)} style={{...BTN('primary'),marginTop:18,width:'100%',padding:11,fontWeight:700}}>فهمت ✓</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:th.head,borderBottom:`1px solid ${th.border}`,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(8px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:`linear-gradient(135deg,${th.acc},${th.acc2})`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:`0 0 16px ${th.acc}44`}}>🛍️</div>
          <div><div style={{fontWeight:800,fontSize:15,color:th.text}}>{cfg.shopName}</div><div style={{fontSize:9,color:th.acc,fontWeight:600,letterSpacing:1}}>VIPGOPAY PRO</div></div>
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {(['ar','fr','en'] as Lang[]).map(l=><button key={l} onClick={()=>setLang(l)} style={{background:lang===l?th.acc:th.surf2,border:'none',color:lang===l?'#fff':th.muted,padding:'3px 7px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:lang===l?700:400}}>{l.toUpperCase()}</button>)}
          <div style={{background:`${th.ok}22`,color:th.ok,border:`1px solid ${th.ok}44`,fontSize:9,padding:'3px 8px',borderRadius:16,marginInlineStart:4,fontWeight:700}}>{T.active}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',background:th.head,borderBottom:`1px solid ${th.border}`,overflowX:'auto',scrollbarWidth:'none' as const}}>
        {T.nav.map((n,i)=><button key={i} onClick={()=>setTab(i)} style={{flex:1,minWidth:60,padding:'9px 3px',background:'none',border:'none',cursor:'pointer',color:tab===i?th.acc:th.muted,borderBottom:tab===i?`2px solid ${th.acc}`:'2px solid transparent',fontFamily:'inherit',fontSize:9,fontWeight:tab===i?700:400,whiteSpace:'nowrap' as const,textShadow:tab===i?`0 0 12px ${th.acc}88`:'none'}}>{n}</button>)}
      </div>

      <div style={{padding:'12px 12px 80px',maxWidth:640,margin:'0 auto'}}>

        {/* TAB 0: INVENTORY */}
        {tab===0&&<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
            {([[T.totalP,prods.length,th.acc],[T.availP,prods.filter(p=>p.stock>0).length,th.ok],[T.outP,prods.filter(p=>p.stock===0).length,th.err]] as [string,number,string][]).map(([l,v,c],i)=>(
              <div key={i} style={{background:th.surf,border:`1px solid ${c}33`,borderRadius:14,padding:'10px 8px',textAlign:'center',boxShadow:`0 0 20px ${c}11`}}>
                <div style={{color:c,fontWeight:900,fontSize:24,textShadow:`0 0 16px ${c}88`}}>{v}</div>
                <div style={{color:th.muted,fontSize:10,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>{setForm({name:'',cat:'',price:'',stock:'',cond:'',specs:''});setEditId(null);setShowForm(true)}} style={{...BTN('primary'),width:'100%',padding:12,marginBottom:12,fontSize:14}}>{T.addBtn}</button>
          <input placeholder={T.search} value={search} onChange={e=>setSearch(e.target.value)} style={{...I(false),marginBottom:12}}/>
          {showForm&&<div style={{...CARD,border:`1px solid ${th.acc}55`,marginBottom:14,boxShadow:`0 0 24px ${th.acc}22`}}>
            <div style={{color:th.acc,fontWeight:700,marginBottom:12}}>{editId?'✏️ Edit':'➕ '+T.addBtn}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {([[T.pName,'name','text',true],[T.pCat,'cat','text',false],[T.pPrice,'price','number',false],[T.pStock,'stock','number',false]] as [string,string,string,boolean][]).map(([label,key,type,full])=>(
                <div key={key} style={{gridColumn:full?'1/-1':'auto'}}><label style={LB}>{label}</label><input type={type} value={(form as Record<string,string>)[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} style={I(false)}/></div>
              ))}
            </div>
            <div style={{marginTop:10}}><label style={LB}>{T.pCond}</label><select value={form.cond||T.conditions[0]} onChange={e=>setForm({...form,cond:e.target.value})} style={I(false)}>{T.conditions.map(c=><option key={c}>{c}</option>)}</select></div>
            <div style={{marginTop:10}}><label style={LB}>{T.pSpecs}</label><input value={form.specs||''} onChange={e=>setForm({...form,specs:e.target.value})} style={I(false)}/></div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button onClick={saveP} style={{...BTN('primary'),flex:1}}>{T.save}</button>
              <button onClick={()=>setShowForm(false)} style={{...BTN('muted'),flex:1}}>{T.cancel}</button>
            </div>
          </div>}
          {bulk!==null&&<div style={{...CARD,border:`1px solid ${th.warn}44`,marginBottom:14}}>
            <div style={{color:th.warn,fontWeight:700,marginBottom:10}}>📦 {T.bulkTitle}</div>
            <input type="number" placeholder={T.bulkPh} value={bulkQ} onChange={e=>setBulkQ(e.target.value)} style={{...I(false),marginBottom:10}}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={async()=>{if(bulk&&bulkQ)await chgStock(bulk,Number(bulkQ));setBulk(null);setBulkQ('');}} style={{...BTN('primary'),flex:1}}>{T.save}</button>
              <button onClick={()=>setBulk(null)} style={{...BTN('muted'),flex:1}}>{T.cancel}</button>
            </div>
          </div>}
          {fProds.length===0
            ?<div style={{textAlign:'center',padding:'40px 20px',color:th.muted}}><div style={{fontSize:48,marginBottom:10}}>📦</div><div style={{fontWeight:600,marginBottom:5}}>{T.noProducts}</div><div style={{fontSize:12}}>{T.addHint}</div></div>
            :fProds.map(p=>(
              <div key={p.id} style={{...CARD,border:`1px solid ${p.stock===0?th.err+'44':th.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:5}}>
                      <span style={{color:th.text,fontWeight:700,fontSize:15}}>{p.name}</span>
                      {p.cat&&<span style={BDG(th.acc)}>{p.cat}</span>}
                      <span style={BDG(th.acc2)}>{p.cond||T.conditions[0]}</span>
                      {p.stock===0&&<span style={BDG(th.err)}>{T.outOfStock}</span>}
                    </div>
                    <div style={{color:th.acc,fontWeight:900,fontSize:18,marginBottom:3,textShadow:`0 0 12px ${th.acc}66`}}>{Number(p.price).toLocaleString()} DZD</div>
                    {p.specs&&<div style={{color:th.muted,fontSize:12}}>{p.specs}</div>}
                  </div>
                  <div style={{display:'flex',gap:5,flexShrink:0,marginInlineStart:8}}>
                    <button onClick={()=>{setBulk(p.id);setBulkQ('');}} style={{background:`${th.warn}22`,border:'none',color:th.warn,width:30,height:30,borderRadius:8,cursor:'pointer',fontSize:12}}>+📦</button>
                    <button onClick={()=>editP(p)} style={{background:`${th.acc}22`,border:'none',color:th.acc,width:30,height:30,borderRadius:8,cursor:'pointer',fontSize:12}}>✏️</button>
                    <button onClick={()=>delP(p.id)} style={{background:`${th.err}22`,border:'none',color:th.err,width:30,height:30,borderRadius:8,cursor:'pointer',fontSize:12}}>🗑</button>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10}}>
                  <span style={{color:th.muted,fontSize:12}}>{T.qty}</span>
                  <button onClick={()=>chgStock(p.id,-1)} style={{background:th.surf2,border:`1px solid ${th.border}`,color:th.text,width:30,height:30,borderRadius:8,cursor:'pointer',fontWeight:800}}>−</button>
                  <span style={{color:p.stock===0?th.err:th.acc,fontWeight:900,fontSize:18,minWidth:26,textAlign:'center',textShadow:`0 0 8px ${p.stock===0?th.err:th.acc}88`}}>{p.stock}</span>
                  <button onClick={()=>chgStock(p.id,1)} style={{background:th.surf2,border:`1px solid ${th.border}`,color:th.text,width:30,height:30,borderRadius:8,cursor:'pointer',fontWeight:800}}>+</button>
                </div>
              </div>
            ))
          }
        </div>}

        {/* TAB 1: CHAT */}
        {tab===1&&<div>
          {chatStep==='product'?<div>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:44,filter:`drop-shadow(0 0 12px ${th.acc}88)`,marginBottom:8}}>💬</div>
              <div style={{fontSize:17,fontWeight:800,color:th.text}}>{T.chatStep1}</div>
              <div style={{color:th.muted,fontSize:12,marginTop:4}}>{T.chatSub}</div>
            </div>
            <div style={CARD}>
              <div style={{marginBottom:12}}>
                <label style={LB}>{T.chatDemoName}</label>
                <input placeholder={T.chatDemoNamePh} value={demoProduct.name} onChange={e=>{setDemoProduct(p=>({...p,name:e.target.value}));setDemoErr('');}} style={I(!!demoErr&&!demoProduct.name.trim())} onKeyDown={e=>e.key==='Enter'&&startChat()}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={LB}>{T.chatDemoPrice}</label>
                <input type="number" placeholder={T.chatDemoPricePh} value={demoProduct.price} onChange={e=>{setDemoProduct(p=>({...p,price:e.target.value}));setDemoErr('');}} style={I(!!demoErr&&(!demoProduct.price.trim()||isNaN(Number(demoProduct.price))))} onKeyDown={e=>e.key==='Enter'&&startChat()}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={LB}>{T.chatDemoSpecs}</label>
                <input placeholder="مثال: لون أسود، ضمان سنة، توصيل سريع" value={demoProduct.specs} onChange={e=>setDemoProduct(p=>({...p,specs:e.target.value}))} style={I(false)} onKeyDown={e=>e.key==='Enter'&&startChat()}/>
              </div>
              {demoErr&&<div style={{background:`${th.err}15`,border:`1px solid ${th.err}33`,borderRadius:9,padding:'9px 12px',color:th.err,fontSize:13,marginBottom:12}}>⚠ {demoErr}</div>}
              <button onClick={startChat} style={{...BTN('primary'),width:'100%',padding:13,fontSize:15}}>{T.chatDemoStart}</button>
            </div>
          </div>:<div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 165px)'}}>
            <div style={{...CARD,display:'flex',alignItems:'center',gap:10,marginBottom:10,padding:'10px 12px'}}>
              <div style={{width:34,height:34,background:`linear-gradient(135deg,${th.acc},${th.acc2})`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>📦</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:th.text,fontWeight:700,fontSize:13}}>{demoProduct.name}</div>
                <div style={{color:th.acc,fontSize:12,fontWeight:800}}>{Number(demoProduct.price).toLocaleString()} DZD{demoProduct.specs?' · '+demoProduct.specs:''}</div>
              </div>
              <button onClick={()=>{setChatStep('product');setMsgs([]);}} style={{...BTN('muted'),padding:'5px 10px',fontSize:11}}>{T.chatDemoReset}</button>
            </div>
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10,paddingBottom:8}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.role==='user'?(T.dir==='rtl'?'flex-start':'flex-end'):(T.dir==='rtl'?'flex-end':'flex-start')}}>
                  <div style={{maxWidth:'83%',padding:'10px 14px',borderRadius:18,background:m.role==='user'?`linear-gradient(135deg,#1a3a6b,${th.acc2}88)`:th.surf,border:m.role==='assistant'?`1px solid ${th.border}`:'none',color:th.text,fontSize:14,lineHeight:1.75,whiteSpace:'pre-wrap'}}>{m.content}</div>
                  {m.time&&<div style={{color:th.border,fontSize:10,marginTop:2,paddingInline:4}}>{m.time}</div>}
                </div>
              ))}
              {aiLoading&&<div style={{display:'flex',justifyContent:T.dir==='rtl'?'flex-end':'flex-start'}}><div style={{background:th.surf,border:`1px solid ${th.border}`,borderRadius:18,padding:'12px 16px',display:'flex',gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:th.acc,animation:`bounce 1.2s ${i*.2}s infinite`}}/>)}</div></div>}
              <div ref={botRef}/>
            </div>
            <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,scrollbarWidth:'none' as const}}>
              {T.quick.map(q=><button key={q} onClick={()=>setInp(q)} style={{background:th.surf,border:`1px solid ${th.border}`,color:th.sub,padding:'6px 12px',borderRadius:18,cursor:'pointer',fontFamily:'inherit',fontSize:12,whiteSpace:'nowrap',flexShrink:0}}>{q}</button>)}
            </div>
            <div style={{display:'flex',gap:8}}>
              <input style={{...I(false),flex:1}} placeholder={T.inputPh} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
              <button onClick={send} disabled={aiLoading} style={{background:`linear-gradient(135deg,${th.acc},${th.acc2})`,border:'none',color:'#fff',width:44,height:44,borderRadius:11,cursor:aiLoading?'not-allowed':'pointer',fontSize:18,flexShrink:0,boxShadow:`0 0 16px ${th.acc}44`}}>➤</button>
            </div>
          </div>}
        </div>}

        {/* TAB 2: ORDERS */}
        {tab===2&&<div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h2 style={{margin:0,fontSize:17,color:th.text}}>{T.ordersTitle}</h2>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={BDG(th.ok)}>{orders.length}</span>
              {orders.length>0&&<button onClick={exportCSV} style={{background:`${th.acc}22`,border:`1px solid ${th.acc}44`,color:th.acc,padding:'5px 11px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700}}>{T.exportCSV}</button>}
            </div>
          </div>
          {orders.length>0&&(()=>{
            const rev=confirmedOrders.reduce((s,o)=>s+(o.price||0),0);
            const pC:Record<string,number>={};orders.forEach(o=>{pC[o.product]=(pC[o.product]||0)+1});
            const topP=Object.entries(pC).sort((a,b)=>b[1]-a[1]).slice(0,3);
            const wC:Record<string,number>={};orders.forEach(o=>{wC[o.cust.wilaya]=(wC[o.cust.wilaya]||0)+1});
            const topW=Object.entries(wC).sort((a,b)=>b[1]-a[1]).slice(0,3);
            const mP=topP[0]?.[1]||1,mW=topW[0]?.[1]||1;
            return<div style={{...CARD,border:`1px solid ${th.acc}33`,marginBottom:14}}>
              <div style={{color:th.acc,fontWeight:700,marginBottom:12,fontSize:14}}>{T.dashTitle}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
                {([[T.dashRevenue,`${rev.toLocaleString()}`,th.ok],[T.dashOrders,orders.length,th.acc],[T.filterConfirmed,confirmedOrders.length,th.ok],[T.filterPending,orders.filter(o=>o.status==='pending').length,th.warn]] as [string,string|number,string][]).map(([l,v,c],i)=>(
                  <div key={i} style={{background:th.surf2,borderRadius:10,padding:'8px 5px',textAlign:'center',border:`1px solid ${c}22`}}>
                    <div style={{color:c,fontWeight:900,fontSize:i===0?9:16,lineHeight:1.2,textShadow:`0 0 8px ${c}66`}}>{v}{i===0?' DZD':''}</div>
                    <div style={{color:th.muted,fontSize:9,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {topP.length>0&&<div><div style={{color:th.muted,fontSize:10,marginBottom:5,fontWeight:600}}>{T.dashTopProducts}</div>{topP.map(([n,c])=><div key={n} style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}><span style={{color:th.sub,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'78%'}}>{n}</span><span style={{color:th.ok,fontWeight:700}}>{c}</span></div><div style={{height:3,background:th.border,borderRadius:3}}><div style={{height:3,borderRadius:3,background:`linear-gradient(90deg,${th.acc},${th.acc2})`,width:`${(c/mP)*100}%`,transition:'width .5s'}}/></div></div>)}</div>}
                {topW.length>0&&<div><div style={{color:th.muted,fontSize:10,marginBottom:5,fontWeight:600}}>{T.dashTopWilayas}</div>{topW.map(([w,c])=><div key={w} style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}><span style={{color:th.sub,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'78%'}}>{w}</span><span style={{color:th.ok,fontWeight:700}}>{c}</span></div><div style={{height:3,background:th.border,borderRadius:3}}><div style={{height:3,borderRadius:3,background:`linear-gradient(90deg,${th.ok},${th.acc})`,width:`${(c/mW)*100}%`,transition:'width .5s'}}/></div></div>)}</div>}
              </div>
            </div>;
          })()}
          <div style={{display:'flex',gap:7,marginBottom:14,overflowX:'auto',paddingBottom:2,scrollbarWidth:'none' as const}}>
            {(['all','pending','confirmed','cancelled'] as const).map(f=>(
              <button key={f} onClick={()=>setOrderFilter(f)} style={PILL(orderFilter===f)}>
                {f==='all'?`${T.filterAll}(${orders.length})`:f==='pending'?`${T.filterPending}(${orders.filter(o=>o.status==='pending').length})`:f==='confirmed'?`${T.filterConfirmed}(${confirmedOrders.length})`:`${T.filterCancelled}(${orders.filter(o=>o.status==='cancelled').length})`}
              </button>
            ))}
          </div>
          {filteredOrders.length===0
            ?<div style={{textAlign:'center',padding:50,color:th.muted}}><div style={{fontSize:44}}>📭</div><div style={{marginTop:10}}>{T.noOrders}</div></div>
            :filteredOrders.map(o=>(
              <div key={o.id} style={{...CARD,border:`1px solid ${o.status==='confirmed'?th.ok+'44':o.status==='cancelled'?th.err+'44':th.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{color:th.acc,fontWeight:700,fontSize:12}}>{o.id}</span>
                  <span style={BDG(o.status==='confirmed'?th.ok:o.status==='cancelled'?th.err:th.warn)}>{(T as unknown as Record<string,string>)[o.status]}</span>
                </div>
                <div style={{color:th.text,fontWeight:700}}>{o.cust.name}</div>
                <div style={{color:th.muted,fontSize:13,marginTop:2}}>{o.cust.phone} • {o.cust.wilaya}{o.cust.commune?' / '+o.cust.commune:''}</div>
                <div style={{background:th.surf2,borderRadius:9,padding:'8px 12px',marginTop:8,border:`1px solid ${th.border}`}}>
                  <span style={{color:th.muted,fontSize:12}}>{T.product} </span>
                  <span style={{color:th.text}}>{o.product}</span>
                  {o.price&&<span style={{color:th.acc,fontWeight:900,marginInlineStart:8,textShadow:`0 0 8px ${th.acc}66`}}>{o.price.toLocaleString()} DZD</span>}
                </div>
                <div style={{color:th.muted,fontSize:11,marginTop:6}}>{o.time}</div>
                <div style={{display:'flex',alignItems:'center',gap:7,marginTop:10,flexWrap:'wrap'}}>
                  <span style={{color:th.muted,fontSize:11}}>{T.shareLabel}</span>
                  <button onClick={()=>shareWA(o)} style={{display:'flex',alignItems:'center',gap:4,background:'#25D36622',border:'1px solid #25D36644',color:'#25D366',padding:'5px 10px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WA
                  </button>
                  <button onClick={()=>shareMsg(o)} style={{background:'#006AFF22',border:'1px solid #006AFF44',color:'#006AFF',padding:'5px 10px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700}}>💬 {copyFb===o.id+'_m'?T.copied:'Msg'}</button>
                  <button onClick={()=>shareIG(o)} style={{background:'#E1146322',border:'1px solid #E1146344',color:'#E11463',padding:'5px 10px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700}}>📸 {copyFb===o.id+'_ig'?T.copied:'IG'}</button>
                </div>
                {o.status==='pending'&&<div style={{display:'flex',gap:8,marginTop:10}}>
                  <button onClick={()=>handleConfirmOrder(o.id)} style={{...BTN('primary'),flex:1,padding:9}}>{T.confirm}{twoFAEnabled&&cfg.email?' 🔒':''}</button>
                  <button onClick={()=>updOrder(o.id,'cancelled')} style={{...BTN('muted'),flex:1,padding:9,color:th.err}}>{T.cancelOrder}</button>
                </div>}
                {notifyStatus[o.id]&&(()=>{
                  const ns=notifyStatus[o.id];
                  const ICONS:Record<string,string>={whatsapp:'💬',telegram:'✈️',instagram:'📸',email:'📧',error:'⚠️'};
                  return<div style={{marginTop:10,borderTop:`1px solid ${th.border}`,paddingTop:10}}>
                    {ns.loading?<div style={{display:'flex',gap:6,alignItems:'center',color:th.muted,fontSize:12}}><div style={{width:12,height:12,border:`2px solid ${th.border}`,borderTop:`2px solid ${th.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite',flexShrink:0}}/>{T.notifLoading}</div>
                    :ns.results.length===0?<div style={{color:th.muted,fontSize:11}}>{T.notifNoPlatforms}</div>
                    :ns.results.map((r,ri)=>(
                      <div key={ri} style={{display:'flex',alignItems:'flex-start',gap:7,marginBottom:6}}>
                        <span style={{fontSize:14}}>{ICONS[r.channel]??'📤'}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{color:r.ok?th.ok:th.err,fontSize:12,fontWeight:700}}>{r.ok?'✅':'❌'} {r.channel}</span>
                          {!r.ok&&r.error&&<div style={{color:th.err,fontSize:11,marginTop:2,wordBreak:'break-word' as const,background:`${th.err}11`,border:`1px solid ${th.err}33`,borderRadius:6,padding:'4px 8px'}}>{r.error}</div>}
                        </div>
                      </div>
                    ))}
                  </div>;
                })()}
              </div>
            ))
          }
        </div>}

        {/* TAB 3: GAMING HUB */}
        {tab===3&&<div>
          <h2 style={{margin:'0 0 14px',fontSize:17,color:th.text}}>{T.gamingHub}</h2>
          <div style={{...CARD,border:`1px solid ${th.ok}44`,boxShadow:`0 0 24px ${th.ok}11`}}>
            <div style={{color:th.text,fontWeight:700,marginBottom:12,fontSize:15}}>{T.gamingWalletTitle}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <div style={{background:th.surf2,borderRadius:12,padding:14,border:`1px solid ${th.ok}33`}}>
                <div style={{color:th.muted,fontSize:11,marginBottom:4}}>{T.gamingRevenue}</div>
                <div style={{color:th.ok,fontWeight:900,fontSize:22,textShadow:`0 0 12px ${th.ok}66`}}>{totalRevenue.toLocaleString()}</div>
                <div style={{color:th.muted,fontSize:10}}>DZD</div>
              </div>
              <div style={{background:th.surf2,borderRadius:12,padding:14,border:`1px solid ${th.acc}33`}}>
                <div style={{color:th.muted,fontSize:11,marginBottom:4}}>{T.gamingPoints}</div>
                <div style={{color:th.acc,fontWeight:900,fontSize:22,textShadow:`0 0 12px ${th.acc}66`}}>{loyaltyPoints.toLocaleString()}</div>
                <div style={{color:th.muted,fontSize:10}}>{T.gamingPointsRate}</div>
              </div>
            </div>
          </div>
          <div style={{...CARD,border:`1px solid ${curTier.color}44`,boxShadow:`0 0 24px ${curTier.color}11`}}>
            <div style={{color:th.text,fontWeight:700,marginBottom:12,fontSize:15}}>{T.gamingTierTitle}</div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <div style={{fontSize:52,filter:`drop-shadow(0 0 16px ${curTier.color}88)`}}>{curTier.icon}</div>
              <div style={{flex:1}}>
                <div style={{color:curTier.color,fontWeight:900,fontSize:20,textShadow:`0 0 16px ${curTier.color}88`}}>{curTier.icon} {curTier.nameAr}</div>
                <div style={{color:th.muted,fontSize:12,marginTop:2}}>{monthCount} {T.gamingMonthly}</div>
                {curTier.discount>0&&<div style={{color:th.ok,fontSize:12,marginTop:2}}>✅ {curTier.discount}% {T.gamingTierDiscount}</div>}
              </div>
            </div>
            {nextTier?(
              <div>
                <div style={{display:'flex',justifyContent:'space-between',color:th.muted,fontSize:11,marginBottom:6}}>
                  <span>{curTier.icon} {curTier.nameAr}</span>
                  <span style={{color:nextTier.color,fontWeight:700}}>{nextTier.icon} {nextTier.nameAr}</span>
                </div>
                <div style={{height:8,background:th.surf2,borderRadius:8,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:8,background:`linear-gradient(90deg,${curTier.color},${nextTier.color})`,width:`${tPct}%`,transition:'width 1s ease',boxShadow:`0 0 8px ${curTier.color}88`}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',color:th.muted,fontSize:10,marginTop:4}}>
                  <span>{tPct}%</span>
                  <span>{T.gamingNextTierLabel}: {nextTier.min - monthCount} طلبيات</span>
                </div>
                <div style={{marginTop:10,background:`${nextTier.color}11`,border:`1px solid ${nextTier.color}33`,borderRadius:10,padding:'8px 12px',fontSize:12,color:nextTier.color}}>
                  {nextTier.icon} {nextTier.nameAr}: {nextTier.discount}% {T.gamingTierDiscount}
                </div>
              </div>
            ):<div style={{background:`${th.acc}11`,border:`1px solid ${th.acc}33`,borderRadius:10,padding:'10px 14px',color:th.acc,fontWeight:700,textAlign:'center'}}>{T.gamingTierMaxed}</div>}
          </div>
          <div style={CARD}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{color:th.text,fontWeight:700,fontSize:15}}>{T.gamingQuickTitle}</div>
              <button onClick={()=>setShowQuickForm(s=>!s)} style={{background:`${th.acc}22`,border:`1px solid ${th.acc}44`,color:th.acc,padding:'6px 12px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:700}}>{showQuickForm?'✕':T.gamingAddShortcut}</button>
            </div>
            {showQuickForm&&(
              <div style={{background:th.surf2,borderRadius:12,padding:14,marginBottom:14,border:`1px solid ${th.border}`}}>
                <div style={{marginBottom:10}}><label style={LB}>{T.gamingQuickName}</label><input value={newQuick.gameName} onChange={e=>setNewQuick(q=>({...q,gameName:e.target.value}))} style={I(false)}/></div>
                <div style={{marginBottom:10}}><label style={LB}>{T.gamingQuickGameId}</label><input value={newQuick.gameId} onChange={e=>setNewQuick(q=>({...q,gameId:e.target.value}))} style={I(false)}/></div>
                <div style={{marginBottom:12}}>
                  <label style={LB}>{T.gamingQuickProduct}</label>
                  <select value={newQuick.productId} onChange={e=>setNewQuick(q=>({...q,productId:e.target.value}))} style={I(false)}>
                    <option value="">{T.gamingQuickProduct}</option>
                    {prods.map(p=><option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} DZD</option>)}
                  </select>
                </div>
                <button onClick={()=>{
                  if(!newQuick.gameName)return;
                  const prod=prods.find(p=>String(p.id)===newQuick.productId);
                  const qo:QuickOrder={id:Date.now().toString(),gameName:newQuick.gameName,gameId:newQuick.gameId,productId:prod?.id??null,productName:prod?.name??''};
                  setQuickOrders(prev=>[...prev,qo]);
                  setNewQuick({gameName:'',gameId:'',productId:''});setShowQuickForm(false);
                }} style={{...BTN('primary'),width:'100%',padding:10,fontSize:13}}>{T.save}</button>
              </div>
            )}
            {quickOrders.length===0&&!showQuickForm&&<div style={{textAlign:'center',color:th.muted,padding:'20px 0',fontSize:13}}>⚡ {T.gamingAddShortcut}</div>}
            {quickOrders.map(qo=>(
              <div key={qo.id} style={{display:'flex',alignItems:'center',gap:10,background:th.surf2,borderRadius:10,padding:'10px 12px',marginBottom:8,border:`1px solid ${th.border}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:th.text,fontWeight:700,fontSize:14}}>{qo.gameName}</div>
                  {qo.gameId&&<div style={{color:th.muted,fontSize:11}}>ID: {qo.gameId}</div>}
                  {qo.productName&&<div style={{color:th.acc,fontSize:11}}>{qo.productName}</div>}
                </div>
                <button onClick={()=>{setQuickModal(qo);setQuickCust({name:'',phone:''});setQuickCustErr('');setQuickSuccess(false);}} style={{background:`linear-gradient(135deg,${th.acc},${th.acc2})`,border:'none',color:'#fff',padding:'7px 12px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:700,flexShrink:0,boxShadow:`0 0 12px ${th.acc}44`}}>{T.gamingRechargeBtn}</button>
                <button onClick={()=>setQuickOrders(q=>q.filter(x=>x.id!==qo.id))} style={{background:`${th.err}22`,border:'none',color:th.err,width:28,height:28,borderRadius:7,cursor:'pointer',fontSize:12,flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{...CARD,border:`1px solid ${twoFAEnabled?th.ok+'44':th.border}`}}>
            <div style={{color:th.text,fontWeight:700,marginBottom:8,fontSize:15}}>{T.twoFATitle}</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:cfg.email?0:10}}>
              <span style={{color:th.sub,fontSize:13,flex:1}}>{T.twoFAToggle}</span>
              <div onClick={()=>{if(cfg.email.trim()||!twoFAEnabled)setTwoFAEnabled(v=>!v);}} style={{width:46,height:26,borderRadius:13,background:twoFAEnabled?th.ok:th.surf2,border:`1px solid ${th.border}`,cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0,marginInlineStart:10,boxShadow:twoFAEnabled?`0 0 12px ${th.ok}55`:'none'}}>
                <div style={{position:'absolute',top:3,insetInlineStart:twoFAEnabled?20:3,width:20,height:20,borderRadius:'50%',background:twoFAEnabled?'#fff':th.muted,transition:'inset-inline-start .2s'}}/>
              </div>
            </div>
            {!cfg.email.trim()&&<div style={{background:`${th.warn}15`,border:`1px solid ${th.warn}33`,borderRadius:9,padding:'8px 12px',color:th.warn,fontSize:12,marginTop:8}}>⚠ {T.twoFANoEmail}</div>}
            {twoFAEnabled&&cfg.email.trim()&&<div style={{background:`${th.ok}15`,border:`1px solid ${th.ok}33`,borderRadius:9,padding:'8px 12px',color:th.ok,fontSize:12,marginTop:8}}>🔒 2FA مفعّل — سيطلب رمز OTP قبل تأكيد كل طلبية: <strong>{cfg.email}</strong></div>}
          </div>
        </div>}

        {/* TAB 4: SETTINGS */}
        {tab===4&&<div>
          <h2 style={{margin:'0 0 14px',fontSize:17,color:th.text}}>{T.settingsTitle}</h2>
          <div style={{...CARD,border:`1px solid ${th.acc}33`}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:44,height:44,borderRadius:'50%',background:avatarColor(email),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',flexShrink:0,boxShadow:`0 0 16px ${avatarColor(email)}66`}}>{email[0]?.toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:th.text,fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{email}</div>
                <div style={{color:th.muted,fontSize:10,marginTop:2}}>VipGoPay Pro • {T.uidLabel}: <code style={{color:th.acc,fontSize:9}}>{uid}</code></div>
              </div>
            </div>
          </div>
          <div style={CARD}>
            <label style={LB}>{T.lang}</label>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {(['ar','fr','en'] as Lang[]).map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,background:lang===l?th.acc:th.surf2,border:`1px solid ${lang===l?th.acc:th.border}`,color:lang===l?'#fff':th.sub,padding:9,borderRadius:9,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:12,boxShadow:lang===l?`0 0 12px ${th.acc}44`:'none'}}>{l==='ar'?'🇩🇿 AR':l==='fr'?'🇫🇷 FR':'🇬🇧 EN'}</button>)}
            </div>
            <label style={LB}>{T.theme}</label>
            <div style={{display:'flex',gap:8}}>
              {(['dark','light'] as const).map(t2=><button key={t2} onClick={()=>setTn(t2)} style={{flex:1,background:tn===t2?th.acc:th.surf2,border:`1px solid ${tn===t2?th.acc:th.border}`,color:tn===t2?'#fff':th.sub,padding:9,borderRadius:9,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:12,boxShadow:tn===t2?`0 0 12px ${th.acc}44`:'none'}}>{t2==='dark'?T.dark:T.light}</button>)}
            </div>
          </div>
          <div style={CARD}>
            {([[T.shopName,'shopName'],[T.emailL,'email'],[T.shopType,'shopType'],[T.location,'location'],[T.hours,'hours'],[T.officeD,'officeDesk','number'],[T.homeD,'officeHome','number'],[T.extra,'extra']] as [string,keyof Config,string?][]).map(([label,key,type])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={{...LB,display:'flex',alignItems:'center',gap:0}}><span>{label}</span><InfoTip k={key}/></label>
                <input type={type||'text'} value={String(cfg[key])||''} onChange={e=>setCfg({...cfg,[key]:e.target.value})} style={I(false)}/>
              </div>
            ))}
          </div>
          <div style={{...CARD,border:`1px solid ${th.acc2}44`}}>
            <div style={{color:th.text,fontWeight:700,marginBottom:6,fontSize:15}}>{T.integSection}</div>
            <div style={{background:`${th.acc}11`,border:`1px solid ${th.acc}22`,borderRadius:10,padding:'9px 12px',fontSize:12,color:th.sub,marginBottom:12,lineHeight:1.7}}>{T.integNote}</div>
            <button onClick={testSend} disabled={testLoading} style={{...BTN('primary'),width:'100%',padding:10,marginBottom:12,fontSize:13,opacity:testLoading?0.7:1}}>{testLoading?T.testSending:T.testNotif}</button>
            {(['wa','tg','ig','emailSvc'] as (keyof IntegConfig)[]).map(key=>{
              const titles:Record<string,string>={wa:T.waTitle,tg:T.tgTitle,ig:T.igTitle,emailSvc:T.emailTitle};
              const conn=isConn(key);
              return(
                <div key={key} style={{border:`1px solid ${conn?th.ok+'55':th.border}`,borderRadius:12,marginBottom:10,overflow:'hidden'}}>
                  <button onClick={()=>setExpandInteg(expandInteg===key?null:key)} style={{width:'100%',background:'none',border:'none',padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',fontFamily:'inherit'}}>
                    <span style={{color:th.text,fontWeight:700,fontSize:13}}>{titles[key]}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={BDG(conn?th.ok:th.muted)}>{conn?T.connected:T.notConnected}</span>
                      <span style={{color:th.muted,fontSize:12,transition:'transform .2s',display:'block',transform:expandInteg===key?'rotate(180deg)':'none'}}>▼</span>
                    </div>
                  </button>
                  {expandInteg===key&&<div style={{padding:'0 14px 14px',borderTop:`1px solid ${th.border}`}}>
                    {key==='wa'&&<>
                      <div style={{marginTop:12,marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.waPhoneId}</span><InfoTip k="waPhoneId"/></label><input placeholder={T.waPhoneIdPh} value={integCfg.wa.phoneNumberId} onChange={e=>setIntegCfg(c=>({...c,wa:{...c.wa,phoneNumberId:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.waToken}</span><InfoTip k="waToken"/></label><input type="password" placeholder={T.waTokenPh} value={integCfg.wa.accessToken} onChange={e=>setIntegCfg(c=>({...c,wa:{...c.wa,accessToken:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:12}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.waPhoneNum}</span><InfoTip k="waPhoneNum"/></label><input placeholder={T.waPhoneNumPh} value={integCfg.wa.phoneNumber} onChange={e=>setIntegCfg(c=>({...c,wa:{...c.wa,phoneNumber:e.target.value}}))} style={I(false)}/></div>
                    </>}
                    {key==='tg'&&<>
                      <div style={{marginTop:12,marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.tgToken}</span><InfoTip k="tgToken"/></label><input type="password" placeholder={T.tgTokenPh} value={integCfg.tg.botToken} onChange={e=>setIntegCfg(c=>({...c,tg:{...c.tg,botToken:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:12}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.tgChatId}</span><InfoTip k="tgChatId"/></label><input placeholder={T.tgChatIdPh} value={integCfg.tg.chatId} onChange={e=>setIntegCfg(c=>({...c,tg:{...c.tg,chatId:e.target.value}}))} style={I(false)}/></div>
                    </>}
                    {key==='ig'&&<>
                      <div style={{marginTop:12,marginBottom:10}}><label style={LB}>{T.igPageType}</label><select value={integCfg.ig.pageType} onChange={e=>setIntegCfg(c=>({...c,ig:{...c.ig,pageType:e.target.value}}))} style={I(false)}>{T.igPageTypes.map(pt=><option key={pt}>{pt}</option>)}</select></div>
                      <div style={{marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.igEmail}</span><InfoTip k="igEmail"/></label><input type="email" placeholder={T.igEmailPh} value={integCfg.ig.email} onChange={e=>setIntegCfg(c=>({...c,ig:{...c.ig,email:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.igAccountId}</span><InfoTip k="igAccountId"/></label><input placeholder={T.igAccountIdPh} value={integCfg.ig.accountId} onChange={e=>setIntegCfg(c=>({...c,ig:{...c.ig,accountId:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.igToken}</span><InfoTip k="igToken"/></label><input type="password" placeholder={T.igTokenPh} value={integCfg.ig.accessToken} onChange={e=>setIntegCfg(c=>({...c,ig:{...c.ig,accessToken:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:12}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.igRecipientId}</span><InfoTip k="igRecipientId"/></label><input placeholder={T.igRecipientIdPh} value={integCfg.ig.recipientId} onChange={e=>setIntegCfg(c=>({...c,ig:{...c.ig,recipientId:e.target.value}}))} style={I(false)}/></div>
                    </>}
                    {key==='emailSvc'&&<>
                      <div style={{marginTop:12,marginBottom:10}}><label style={LB}>{T.emailService}</label><select value={integCfg.emailSvc.service} onChange={e=>setIntegCfg(c=>({...c,emailSvc:{...c.emailSvc,service:e.target.value}}))} style={I(false)}><option value="resend">Resend</option><option value="mailjet">Mailjet</option><option value="sendgrid">SendGrid</option><option value="smtp">SMTP Custom</option></select></div>
                      <div style={{marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.emailApiKey}</span><InfoTip k="emailApiKey"/></label><input type="password" placeholder={T.emailApiKeyPh} value={integCfg.emailSvc.apiKey} onChange={e=>setIntegCfg(c=>({...c,emailSvc:{...c.emailSvc,apiKey:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:10}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.emailSender}</span><InfoTip k="emailSender"/></label><input type="email" placeholder={T.emailSenderPh} value={integCfg.emailSvc.senderEmail} onChange={e=>setIntegCfg(c=>({...c,emailSvc:{...c.emailSvc,senderEmail:e.target.value}}))} style={I(false)}/></div>
                      <div style={{marginBottom:12}}><label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.emailSenderName}</span><InfoTip k="emailSenderName"/></label><input placeholder={T.emailSenderNamePh} value={integCfg.emailSvc.senderName} onChange={e=>setIntegCfg(c=>({...c,emailSvc:{...c.emailSvc,senderName:e.target.value}}))} style={I(false)}/></div>
                    </>}
                    <button onClick={()=>saveInteg(key)} style={{...BTN('primary'),width:'100%',padding:10,fontSize:13}}>{integSaved[key]?T.integSaved:T.saveInteg}</button>
                  </div>}
                </div>
              );
            })}
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${th.border}`}}>
              <div style={{color:th.muted,fontSize:11,fontWeight:600,marginBottom:6}}>{T.webhookTitle}</div>
              <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:10}}>
                <code style={{flex:1,background:th.surf2,border:`1px solid ${th.border}`,borderRadius:8,padding:'7px 10px',fontSize:9,color:th.sub,wordBreak:'break-all' as const,lineHeight:1.6}}>{webhookUrl}</code>
                <button onClick={()=>{navigator.clipboard.writeText(webhookUrl);setCopiedWh(true);setTimeout(()=>setCopiedWh(false),2000)}} style={{...BTN('muted'),padding:'9px 11px',fontSize:14,flexShrink:0}}>{copiedWh?'✅':'📋'}</button>
              </div>
              <div style={{color:th.muted,fontSize:11,fontWeight:600,marginBottom:6}}>{T.webhookSecret}</div>
              <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:8}}>
                <code style={{flex:1,background:th.surf2,border:`1px solid ${th.border}`,borderRadius:8,padding:'7px 10px',fontSize:9,color:th.sub,wordBreak:'break-all' as const}}>{showSecret?webhookSecret:'•'.repeat(32)}</code>
                <button onClick={()=>setShowSecret(s=>!s)} style={{...BTN('muted'),padding:'9px 11px',fontSize:14,flexShrink:0}}>{showSecret?'🙈':'👁'}</button>
                <button onClick={()=>navigator.clipboard.writeText(webhookSecret)} style={{...BTN('muted'),padding:'9px 11px',fontSize:14,flexShrink:0}}>📋</button>
              </div>
              <div style={{background:`${th.acc}11`,border:`1px solid ${th.acc}22`,borderRadius:8,padding:'8px 10px',fontSize:11,color:th.sub,lineHeight:1.7}}>{T.webhookNote}</div>
            </div>
          </div>
          <div style={CARD}>
            <div style={{color:th.text,fontWeight:700,marginBottom:12}}>{T.notifSection}</div>
            {notifPerm==='granted'?<div style={{background:`${th.ok}15`,border:`1px solid ${th.ok}33`,borderRadius:9,padding:'9px 12px',fontSize:12,color:th.ok,marginBottom:12}}>{T.notifEnabled}</div>
            :notifPerm==='denied'?<div style={{background:`${th.err}15`,border:`1px solid ${th.err}33`,borderRadius:9,padding:'9px 12px',fontSize:12,color:th.err,marginBottom:12}}>{T.notifDenied}</div>
            :<button onClick={async()=>setNotifPerm(await Notification.requestPermission())} style={{...BTN('primary'),width:'100%',padding:10,marginBottom:12,fontSize:13}}>{T.enableNotif}</button>}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0'}}>
              <span style={{color:th.sub,fontSize:13}}>{T.muteNotif}</span>
              <div onClick={()=>setCfg(c=>({...c,muteNotif:!c.muteNotif}))} style={{width:44,height:24,borderRadius:12,background:cfg.muteNotif?th.acc:th.surf2,border:`1px solid ${th.border}`,cursor:'pointer',position:'relative',transition:'background .2s',boxShadow:cfg.muteNotif?`0 0 10px ${th.acc}44`:'none'}}>
                <div style={{position:'absolute',top:2,insetInlineStart:cfg.muteNotif?20:2,width:20,height:20,borderRadius:'50%',background:cfg.muteNotif?'#fff':th.muted,transition:'inset-inline-start .2s'}}/>
              </div>
            </div>
          </div>
          <div style={CARD}>
            <label style={{...LB,display:'flex',alignItems:'center'}}><span>{T.model}</span><InfoTip k="model"/></label>
            <select value={cfg.model} onChange={e=>setCfg({...cfg,model:e.target.value})} style={{...I(false),marginBottom:10}}>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash ⚡</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro 🏆</option>
            </select>
            <div style={{background:`${th.acc}11`,border:`1px solid ${th.acc}22`,borderRadius:9,padding:'9px 12px',fontSize:12,color:th.sub}}>{T.apiNote}</div>
          </div>
          <div style={CARD}><button onClick={()=>setShowPrivacy(true)} style={{...BTN('muted'),width:'100%',padding:11,color:th.acc}}>{T.privacyBtn}</button></div>
          <div style={{background:`${th.ok}11`,border:`1px solid ${th.ok}22`,borderRadius:12,padding:'10px 14px',marginBottom:12,fontSize:13,color:th.ok}}>✅ {T.saved}</div>
          <div style={{...CARD,border:`1px solid ${th.err}33`}}>
            <div style={{color:th.muted,fontSize:11,marginBottom:10,fontWeight:600}}>⚠️ Danger Zone</div>
            <button onClick={()=>{if(window.confirm(T.clearQ)){setProds([]);setOrders([]);setQuickOrders([]);lss(K('prods'),[]);lss(K('orders'),[]);lss(K('quick'),[]);}}} style={{...BTN('danger'),width:'100%',marginBottom:10}}>{T.clearAll}</button>
            <button onClick={onLogout} style={{background:'transparent',border:`1px solid ${th.border}`,color:th.muted,width:'100%',padding:'10px 16px',borderRadius:10,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13}}>{T.logoutBtn}</button>
          </div>
        </div>}
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        *{box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:${th.muted}}
        select option{background:${th.surf};color:${th.text}}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:${th.acc}44;border-radius:4px}
        input:focus,select:focus,textarea:focus{border-color:${th.acc}!important;box-shadow:0 0 0 2px ${th.acc}22;outline:none}
        button:active{transform:scale(0.97)}
      `}</style>
    </div>
  );
}
