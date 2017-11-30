#upload files
s3cmd --exclude '.git/*' sync --delete-removed ./dist/ s3://paris.tika.io/
#set content type of css files
s3cmd --recursive modify --add-header='content-type':'text/css' --exclude '' --include '.css' s3://paris.tika.io/
#make everything public
s3cmd setacl s3://paris.tika.io/ --acl-public --recursive
