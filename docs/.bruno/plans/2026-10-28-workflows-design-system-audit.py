import re,sys,os,collections
LAYOUT=re.compile(r'^(-?)(flex|inline-flex|grid|block|inline|inline-block|hidden|contents|items-|justify-|self-|content-|place-|grow|shrink|basis-|order-|flex-|grid-cols-\d+$|col-span-|row-span-|gap-|gap-x-|gap-y-|space-[xy]-|p[trblxy]?-|m[trblxy]?-|w-full$|h-full$|w-auto$|h-auto$|min-w-0$|min-h-0$|max-w-full$|truncate$|overflow-|whitespace-|break-|text-left$|text-center$|text-right$|relative$|absolute$|sticky$|inset-|top-|left-|right-|bottom-|z-|sr-only$|not-sr-only$|list-none$|cursor-|select-|pointer-events-|visible$|invisible$|first:|last:|group$|peer$|shrink-0$|grow$|w-fit$|h-fit$|size-full$|aspect-|line-clamp-|isolate$)')
TOKEN_SPACING=re.compile(r'^-?(p[trblxy]?|m[trblxy]?|gap(-[xy])?|space-[xy]|inset|top|left|right|bottom)-(\[|\d)')
cls=re.compile(r'className=\{?\s*(?:"([^"]*)"|\'([^\']*)\'|`([^`]*)`)')
cn=re.compile(r'"([a-z0-9:\-\[\]_/#.%! ]{3,})"')
out=collections.defaultdict(list)
for root in sys.argv[1:]:
  for d,_,fs in os.walk(root):
    if 'node_modules' in d or '/dist' in d: continue
    for f in fs:
      if not f.endswith('.tsx') or '.test.' in f: continue
      p=os.path.join(d,f); src=open(p).read()
      for i,line in enumerate(src.split('\n'),1):
        if 'className' not in line and 'cn(' not in line and '_CLASSES' not in line and 'Class' not in line: continue
        for m in re.finditer(r'"([^"]*)"|`([^`$]*)`',line):
          s=(m.group(1) or m.group(2) or '')
          toks=s.split()
          if not toks or not all(re.match(r'^[a-z\-\[\]:0-9_/#.%!&>()=,*]+$',t) for t in toks): continue
          bad=[t for t in toks if not LAYOUT.match(t.split(':')[-1]) or TOKEN_SPACING.match(t.split(':')[-1]) or '[' in t]
          if bad: out[p].append((i,' '.join(bad)))
tot=0
for p,v in sorted(out.items()):
  for i,b in v: tot+=1; print(f"{p}:{i}: {b}")
print("TOTAL",tot,"FILES",len(out),file=sys.stderr)
