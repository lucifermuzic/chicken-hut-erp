@echo off
chcp 65001 >nul
echo =========================================
echo Chicken Hut ERP - GitHub Uploader
echo =========================================

REM التحقق من وجود Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git غير مثبت على جهازك! يرجى تحميله من https://git-scm.com/
    pause
    exit /b
)

REM تهيئة المستودع إذا لم يكن موجوداً
if not exist .git (
    echo جاري تهيئة Git...
    git init
    
    REM إنشاء ملف التجاهل حتى لا يرفع ملفات النظام الثقيلة
    if not exist .gitignore (
        echo node_modules/ > .gitignore
        echo .next/ >> .gitignore
        echo out/ >> .gitignore
        echo build/ >> .gitignore
        echo .env >> .gitignore
        echo .env.local >> .gitignore
    )
)

echo جاري إضافة الملفات...
git add .

set /p commitMsg="أدخل وصف للتعديلات (أو اضغط Enter للوصف الافتراضي): "
if "%commitMsg%"=="" set commitMsg=تحديث نظام Chicken Hut ERP

echo جاري حفظ التعديلات محلياً...
git commit -m "%commitMsg%"

REM التحقق من وجود رابط مستودع عن بعد
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    set /p repoUrl="أدخل رابط مستودع GitHub الخاص بك (مثال: https://github.com/username/repo.git): "
    if not "!repoUrl!"=="" (
        git remote add origin %repoUrl%
        git branch -M main
        echo جاري الرفع إلى GitHub...
        git push -u origin main
    ) else (
        echo لم يتم إدخال رابط! لم يتم الرفع.
    )
) else (
    echo جاري الرفع إلى المستودع الحالي...
    git push origin main
)

echo.
echo تمت العملية! اضغط أي زر للخروج.
pause
