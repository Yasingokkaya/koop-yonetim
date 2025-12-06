import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, getDoc, doc, setDoc, collection, query, where, getDocs } from "./firebase-config.js";

export async function sistemGiris(girdi, sifre) {
    // 1. Girdiyi E-Posta formatına çevir
    let email;
    let telefonNo = "";

    if (girdi.includes('@')) {
        email = girdi;
    } else {
        // Telefon numarasını temizle
        telefonNo = girdi.replace(/\s/g, '');
        if (telefonNo.startsWith('0')) telefonNo = telefonNo.substring(1);
        email = `${telefonNo}@koop.com`;
    }

    try {
        console.log("Giriş deneniyor:", email);
        
        // 2. ÖNCE GİRİŞ YAPMAYI DENE (Zaten şifresi varsa)
        await signInWithEmailAndPassword(auth, email, sifre);
        
        // Giriş başarılıysa yönlendir
        await yonlendir(auth.currentUser);

    } catch (error) {
        console.log("Giriş hatası:", error.code);

        // --- KRİTİK NOKTA: KULLANICI YOKSA VE TELEFON İLE GİRİYORSA ---
        if ((error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') && !girdi.includes('@')) {
            
            console.log("Kullanıcı Auth'da yok, Üye listesi kontrol ediliyor...");
            
            // Members tablosunda bu telefonu arayalım
            const q = query(collection(db, "members"), where("telefon", "==", `0${telefonNo}`)); // Veritabanında başında 0 ile kayıtlı olabilir
            const q2 = query(collection(db, "members"), where("telefon", "==", telefonNo)); // Başında 0 olmadan kayıtlı olabilir
            
            const snapshot1 = await getDocs(q);
            const snapshot2 = await getDocs(q2);

            let bulunanUye = null;
            if (!snapshot1.empty) bulunanUye = snapshot1.docs[0];
            else if (!snapshot2.empty) bulunanUye = snapshot2.docs[0];

            if (bulunanUye) {
                // EĞER ADMİN BU NUMARAYI DAHA ÖNCE EKLEMİŞSE:
                const uyeData = bulunanUye.data();
                const uyeId = bulunanUye.id;
                const sirketId = uyeData.coopId;

                try {
                    // Otomatik Hesap Oluştur (Register)
                    const userCred = await createUserWithEmailAndPassword(auth, email, sifre);
                    const user = userCred.user;

                    // Users tablosuna yetki yaz
                    await setDoc(doc(db, "users", user.uid), {
                        email: email,
                        role: 'member',
                        coopId: sirketId,
                        relatedMemberId: uyeId,
                        createdAt: new Date()
                    });

                    alert("✅ Hesabınız başarıyla oluşturuldu ve eşleştirildi! Giriş yapılıyor...");
                    await yonlendir(user);

                } catch (createError) {
    console.error("Kayıt Hatası Detayı:", createError);
    if (createError.code === 'auth/weak-password') {
        alert("HATA: Şifreniz en az 6 karakter olmalıdır!");
    } else if (createError.code === 'auth/email-already-in-use') {
        alert("HATA: Bu kullanıcı zaten kayıtlı, ancak şifre yanlış girildi.");
    } else {
        alert("Hesap oluşturulurken hata: " + createError.message);
    }
}
            } else {
                alert("❌ Bu telefon numarası sistemde kayıtlı değil. Lütfen yöneticinizle iletişime geçin.");
            }
        } else {
            alert("Giriş başarısız! Şifre yanlış olabilir.");
        }
    }
}

// Yönlendirme Fonksiyonu
async function yonlendir(user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        sessionStorage.setItem("userRole", data.role);
        sessionStorage.setItem("coopId", data.coopId);

        if (data.role === 'admin') window.location.href = "panels/admin.html";
        else if (data.role === 'member') window.location.href = "panels/member.html";
        else if (data.role === 'driver') window.location.href = "panels/driver.html";
        else alert("Rol tanımlanmamış.");
    } else {
        alert("Kullanıcı veri kaydı bulunamadı.");
    }
}