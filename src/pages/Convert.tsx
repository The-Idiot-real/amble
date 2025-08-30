import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Convert() {
  const [file, setFile] = useState<File | null>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const { data, error } = await supabase.storage
      .from("files")
      .upload(`conversions/${Date.now()}-${file.name}`, file);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setConversions((prev) => [
      ...prev,
      { original: file.name, converted: `Converted_${file.name}` },
    ]);

    setFile(null);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">File Converter</h1>

      <div className="flex items-center gap-3">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? "Converting..." : "Convert"}
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {conversions.map((c, i) => (
          <li key={i} className="p-3 border rounded flex justify-between">
            <span>{c.original}</span>
            <span className="text-green-500">{c.converted}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
