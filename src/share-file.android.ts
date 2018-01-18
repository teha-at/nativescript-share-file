import { Common } from './share-file.common';
import * as application from 'tns-core-modules/application';
import * as fs from 'tns-core-modules/file-system';

export class ShareFile extends Common {

    constructor() {
        super();
    }

    open(path): void {
        try {
            let intent = new android.content.Intent();
            let map = android.webkit.MimeTypeMap.getSingleton();
            let mimeType = map.getMimeTypeFromExtension(this.fileExtension(path));

            intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);

            let uris = new java.util.ArrayList();
            let uri = this._getUriForPath(path, '/' + this.fileName(path), application.android.context);
            uris.add(uri);
            let builder = new android.os.StrictMode.VmPolicy.Builder();
            android.os.StrictMode.setVmPolicy(builder.build());

            intent.setAction(android.content.Intent.ACTION_SEND);
            intent.setType(mimeType);
            intent.putParcelableArrayListExtra(android.content.Intent.EXTRA_STREAM, uris);


            application.android.currentContext.startActivity(android.content.Intent.createChooser(intent, "Open " + mimeType));

        }
        catch (e) {
            console.log("Android intent failed");
        }

    }

    fileExtension(filename) {
        return filename.split('.').pop();
    }
    fileName(filename) {
        return filename.split('/').pop();
    }

    _getUriForPath(path, fileName, ctx) {
        if (path.indexOf("file:///") === 0) {
          return this._getUriForAbsolutePath(path);
        } else if (path.indexOf("file://") === 0) {
          return this._getUriForAssetPath(path, fileName, ctx);
        } else if (path.indexOf("base64:") === 0) {
          return this._getUriForBase64Content(path, fileName, ctx);
        } else {
          if (path.indexOf(ctx.getPackageName()) > -1) {
            return this._getUriForAssetPath(path, fileName, ctx);
          } else {
            return this._getUriForAbsolutePath(path);
          }
        }
      }
       _getUriForAbsolutePath(path) {
        let absPath = path.replace("file://", "");
        let file = new java.io.File(absPath);
        if (!file.exists()) {
          console.log("File not found: " + file.getAbsolutePath());
          return null;
        } else {
          return android.net.Uri.fromFile(file);
        }
      }
       _getUriForAssetPath(path, fileName, ctx) {
        path = path.replace("file://", "/");
        if (!fs.File.exists(path)) {
          console.log("File does not exist: " + path);
          return null;
        }
        let localFile = fs.File.fromPath(path);
        let localFileContents = localFile.readSync(function(e) { console.log(e); });
        let cacheFileName = this._writeBytesToFile(ctx, fileName, localFileContents);
        if (cacheFileName.indexOf("file://") === -1) {
          cacheFileName = "file://" + cacheFileName;
        }
        return android.net.Uri.parse(cacheFileName);
      }
       _getUriForBase64Content(path, fileName, ctx) {
        let resData = path.substring(path.indexOf("://") + 3);
        let bytes;
        try {
          bytes = android.util.Base64.decode(resData, 0);
        } catch (ex) {
          console.log("Invalid Base64 string: " + resData);
          return android.net.Uri.EMPTY;
        }
        let cacheFileName = this._writeBytesToFile(ctx, fileName, bytes);
        return android.net.Uri.parse(cacheFileName);
      }
       _writeBytesToFile(ctx, fileName, contents) {
        let dir = ctx.getExternalCacheDir();
        if (dir === null) {
          console.log("Missing external cache dir");
          return null;
        }
        let storage = dir.toString() + "/emailcomposer";
        let cacheFileName = storage + "/" + fileName;
        let toFile = fs.File.fromPath(cacheFileName);
        toFile.writeSync(contents, function(e) { console.log(e); });
        if (cacheFileName.indexOf("file://") === -1) {
          cacheFileName = "file://" + cacheFileName;
        }
        return cacheFileName;
      }
    _cleanAttachmentFolder() {
        if (application.android.context) {
          let dir = application.android.context.getExternalCacheDir();
          let storage = dir.toString() + "/emailcomposer";
          let cacheFolder = fs.Folder.fromPath(storage);
          cacheFolder.clear();
        }
      }
      toStringArray(arg) {
        let arr = java.lang.reflect.Array.newInstance(java.lang.String.class, arg.length);
        for (let i = 0; i < arg.length; i++) {
          arr[i] = arg[i];
        }
        return arr;
      }

}