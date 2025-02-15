**Steps to Configure Nginx for Serving HLS Videos with `root`**

1. **Open Terminal and Navigate to Nginx Sites-Available Directory**

   ```bash
   cd /etc/nginx/sites-available
   ```

2. **Create or Edit the Nginx Configuration File**

   ```bash
   sudo nano netflix_clone.conf
   ```

3. **Add the Nginx Configuration for Serving HLS Videos**

   ```nginx
   server {
       listen 80;
       server_name localhost;

       location /videos {
           root /home/mr_yogesh/code/Netflix-clone-backend;
           autoindex on;

           add_header 'Access-Control-Allow-Origin' 'http://localhost:5173' always;
           add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
           add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

           sendfile on;
           tcp_nopush on;
           aio threads;
           directio 512;

           if ($request_method = 'OPTIONS') {
               add_header 'Access-Control-Allow-Origin' 'http://localhost:5173' always;
               add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
               add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
               add_header 'Content-Length' 0;
               add_header 'Content-Type' 'text/plain; charset=utf-8';
               return 204;
           }
       }

       location ~* \.(m3u8|ts)$ {
           root /home/mr_yogesh/code/Netflix-clone-backend;
           add_header 'Access-Control-Allow-Origin' 'http://localhost:5173' always;
           add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
           add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

           types {
               application/vnd.apple.mpegurl m3u8;
               video/mp2t ts;
           }
       }
   }
   ```

4. **Save and Exit the File**

   - Press `Ctrl + X`, then `Y`, and `Enter`.

5. **Create a Symbolic Link to Enable the Configuration**

   ```bash
   sudo ln -s /etc/nginx/sites-available/netflix_clone.conf /etc/nginx/sites-enabled/
   ```

6. **Test Nginx Configuration**

   ```bash
   sudo nginx -t
   ```

7. **Restart Nginx to Apply Changes**

   ```bash
   sudo systemctl restart nginx
   ```

8. **Verify the Setup by Accessing**
   - Open the browser and go to `http://localhost/videos/yourfile.m3u8` to ensure HLS videos are served correctly.

**Note:**

- Ensure the directory `/home/mr_yogesh/code/Netflix-clone-backend` contains `.m3u8` and `.ts` files.
- Ensure correct ownership and permissions with `sudo chown -R www-data:www-data /home/mr_yogesh/code/Netflix-clone-backend` and `sudo chmod -R 755 /home/mr_yogesh/code/Netflix-clone-backend`.

curl -I http://localhost

sudo tail -f /var/log/nginx/error.log => to check log

=>unlink any if there is
sudo unlink /etc/nginx/sites-enabled/default
