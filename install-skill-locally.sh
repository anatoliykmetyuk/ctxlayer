rm -rv ~/.agents/skills/ctxlayer || true
rm -v ~/.cursor/skills/ctxlayer || true

npx skills add ./ -g -a cursor --skill ctxlayer -y