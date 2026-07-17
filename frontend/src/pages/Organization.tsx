import { useEffect, useState } from 'react';
import Shell from '../components/Shell';
import api from '../api/client';
import type { OrgNode } from '../types';

function TreeNode({ node }: { node: OrgNode }) {
  return (
    <div className="pl-4 border-l border-black/10 dark:border-white/15 ml-2 mt-2 first:mt-0">
      <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1e26] px-4 py-2.5 inline-block">
        <p className="font-medium text-sm">{node.name}</p>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {node.designation} · {node.department}
        </p>
      </div>
      {node.children.length > 0 && (
        <div className="ml-2">
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Organization() {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/organization/tree')
      .then((res) => setTree(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Organization Chart</h1>
      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : tree.length === 0 ? (
        <p className="text-sm text-ink/50">No organizational data yet.</p>
      ) : (
        <div className="space-y-4">
          {tree.map((root) => (
            <TreeNode key={root._id} node={root} />
          ))}
        </div>
      )}
    </Shell>
  );
}
