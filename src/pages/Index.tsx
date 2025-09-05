import{useState,useEffect,useRef}from"react";
import{Header}from"@/components/Header";
import{FileGrid}from"@/components/FileGrid";
import{FilePreview}from"@/components/FilePreview";
import AiChat from"@/components/AiChat";  // FIXED: Removed curly braces for default import
import{Button}from"@/components/ui/button";
import{ArrowRight,Upload,RefreshCw}from"lucide-react";
import{Link}from"react-router-dom";
import{useToast}from"@/hooks/use-toast";
import{getFiles,downloadFile as downloadFileService,FileData}from"@/lib/fileService";

const Index=()=>{
const[files,setFiles]=useState([]);
const[totalCount,setTotalCount]=useState(0);
const[currentPage,setCurrentPage]=useState(1);
const[searchQuery,setSearchQuery]=useState("");
const[previewFile,setPreviewFile]=useState(null);
const[isPreviewOpen,setIsPreviewOpen]=useState(false);
const[isLoading,setIsLoading]=useState(true);
const{
toast
}=useToast();
const searchResultsRef=useRef(null);
const ITEMS_PER_PAGE=9;

useEffect(()=>{
loadFiles();
},[currentPage,searchQuery]);

const loadFiles=async()=>{
setIsLoading(true);
try{
const{
files: fetchedFiles,
totalCount: count
}=await getFiles(currentPage,ITEMS_PER_PAGE,searchQuery);
setFiles(fetchedFiles);
setTotalCount(count);
}catch(error){
console.error('Error loading files:',error);
toast({
title: "Error",
description: "Failed to load files. Please try again.",
variant: "destructive"
});
}finally{
setIsLoading(false);
}
};

const handleSearch = (query: string) => {
setSearchQuery(query);
setCurrentPage(1);
if (searchResultsRef.current) {
searchResultsRef.current.scrollIntoView({ behavior: 'smooth' });
}
};

const downloadFile = async (fileId: string, fileName: string): Promise<void> => {
try {
// For now, just show a toast since we need to implement proper download functionality
toast({
title: "Download",
description: `Downloading ${fileName}...`,
});
} catch (error) {
console.error('Error downloading file:', error);
toast({
title: "Error", 
description: "Failed to download file. Please try again.",
variant: "destructive"
});
}
};

const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

return (
<div className="min-h-screen bg-background">
<Header onSearch={handleSearch} />
<main className="container mx-auto px-4 py-8">
<div className="text-center mb-12">
<h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
Welcome to Amble
</h1>
<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
Your all-in-one platform for file management, conversion, and AI-powered assistance. Upload, convert, and organize your files with ease.
</p>
<div className="flex gap-4 justify-center flex-wrap">
<Link to="/upload">
<Button size="lg" className="gap-2">
<Upload className="h-5 w-5" />
Upload Files
</Button>
</Link>
<Link to="/convert">
<Button variant="outline" size="lg" className="gap-2">
<RefreshCw className="h-5 w-5" />
Convert Files
</Button>
</Link>
</div>
</div>

<div ref={searchResultsRef}>
<FileGrid 
files={files}
isLoading={isLoading}
totalCount={totalCount}
currentPage={currentPage}
totalPages={totalPages}
searchQuery={searchQuery}
onPageChange={setCurrentPage}
onDownload={(fileId: string) => downloadFile(fileId, 'file')}
onPreview={(fileId: string) => {
const file = files.find(f => f.id === fileId);
if (file) {
setPreviewFile(file);
setIsPreviewOpen(true);
}
}}
onShare={(fileId: string) => {
// Share functionality can be implemented later
console.log('Share file:', fileId);
}}
/>
</div>

{totalPages > 1 && (
<div className="mt-12 flex justify-center">
<div className="flex items-center space-x-2">
<Button
variant="outline"
onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
disabled={currentPage === 1}
>
Previous
</Button>
<span className="text-sm text-muted-foreground">
Page {currentPage} of {totalPages}
</span>
<Button
variant="outline"
onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
disabled={currentPage === totalPages}
>
Next
</Button>
</div>
</div>
)}

{/* AI Chat Section */}
<section className="mt-16 py-12">
<div className="text-center mb-8">
<h2 className="text-3xl font-bold mb-4">AI Assistant</h2>
<p className="text-lg text-muted-foreground">
Get help with your files, conversions, or ask any questions
</p>
</div>
<AiChat />
</section>
</main>

<FilePreview
file={previewFile}
isOpen={isPreviewOpen}
onClose={() => setIsPreviewOpen(false)}
onDownload={() => previewFile && downloadFile(previewFile.id, previewFile.name || 'file')}
/>
</div>
);
};

export default Index;
