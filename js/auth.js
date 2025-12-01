// js/auth.js
import { auth, db, signInWithEmailAndPassword, getDoc, doc } from "./firebase-config.js";

// SİSTEME GİRİŞ FONKSİYONU
export async function sistemGiris(email, sifre) {
    try {
        // 1. Önce e-posta ve şifre doğru mu diye Firebase'e soruyoruz
        const userCredential = await signInWithEmailAndPassword(auth, email, sifre);
        const user = userCredential.user;

        console.log("Kullanıcı doğrulandı, veritabanı kontrol ediliyor...");

        // 2. Doğruysa, bu kişinin "Rolü" nedir (Şoför mü, Başkan mı?) veritabanından öğreniyoruz
        // "users" koleksiyonunda, bu kişinin ID'sine sahip belgeyi çekiyoruz
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const rol = userData.role; // 'admin', 'driver' veya 'member'
            const koopId = userData.coopId;

            console.log(`Giriş Başarılı! Rol: ${rol}, Koop: ${koopId}`);
            
            // Kullanıcı bilgilerini tarayıcı hafızasına (sessionStorage) atalım ki diğer sayfalarda kullanalım
            sessionStorage.setItem("userRole", rol);
            sessionStorage.setItem("coopId", koopId);

            // 3. Role göre ilgili sayfaya yönlendir
            alert("Giriş Başarılı! Yönlendiriliyorsunuz...");
            
            if (rol === "admin") {
                window.location.href = "panels/admin.html";
            } else if (rol === "driver") {
                window.location.href = "panels/driver.html";
            } else if (rol === "member") {
                window.location.href = "panels/member.html";
            } else {
                alert("Hata: Bu kullanıcının yetkisi tanımlanmamış!");
            }
        } else {
            console.error("Kullanıcı Auth'da var ama Firestore'da kaydı yok!");
            alert("Kullanıcı kaydı veritabanında bulunamadı! Yöneticiyle iletişime geçin.");
        }

    } catch (error) {
        console.error("Giriş Hatası:", error);
        alert("Giriş başarısız! E-posta veya şifre hatalı.");
    }
}