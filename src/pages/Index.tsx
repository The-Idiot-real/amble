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

// ... rest of the file remains the same
