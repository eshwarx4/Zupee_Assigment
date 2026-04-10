import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBSHNJA8oyhUEqKaFrf6ODi98XhIklzXA0',
    appId: '1:243983043888:web:60045cc29c9e86e75a4cf5',
    messagingSenderId: '243983043888',
    projectId: 'zupee-35ca1',
    authDomain: 'zupee-35ca1.firebaseapp.com',
    storageBucket: 'zupee-35ca1.firebasestorage.app',
    measurementId: 'G-92R57ZPTME',
  );

  // For Android, user needs to add google-services.json
  // Using web config as fallback
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCi7im9FEASY07uGPjVD7m99f7rEqQe_RY',
    appId: '1:243983043888:android:eb97ccede4bee2305a4cf5',
    messagingSenderId: '243983043888',
    projectId: 'zupee-35ca1',
    storageBucket: 'zupee-35ca1.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBSHNJA8oyhUEqKaFrf6ODi98XhIklzXA0',
    appId: '1:243983043888:web:60045cc29c9e86e75a4cf5',
    messagingSenderId: '243983043888',
    projectId: 'zupee-35ca1',
    storageBucket: 'zupee-35ca1.firebasestorage.app',
    iosBundleId: 'com.bharatnivesh.saathi',
  );
}
