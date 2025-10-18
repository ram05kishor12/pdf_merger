"use client";

import { useState } from "react";
import { Upload, Scissors, Merge, Download, FileText, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { splitPDF } from "./server/route1";
import { mergePDF } from "./server/route";

export default function Home() {
    const [files, setFiles] = useState<FileList | null>(null);
    const [splitPage, setSplitPage] = useState("");
    const [mergedUrl, setMergedUrl] = useState("");
    const [splitUrls, setSplitUrls] = useState<{ part1: string; part2: string } | null>(null);
    const [activeTab, setActiveTab] = useState("merge");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleMerge = async () => {
        if (!files) return;

        setIsLoading(true);
        setError("");

        try {
            // Check total file size (limit to 8MB)
            const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
            if (totalSize > 8 * 1024 * 1024) {
                throw new Error("Total file size exceeds 8MB. Please use smaller files.");
            }

            // Pass File objects directly to mergePDF
            const bytesArray = await mergePDF(Array.from(files));
            const uint8Array = new Uint8Array(bytesArray);
            const blob = new Blob([uint8Array], { type: "application/pdf" });
            setMergedUrl(URL.createObjectURL(blob));
            setFiles(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to merge PDFs");
            console.error("Merge error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSplit = async () => {
        if (!files || !splitPage) return;

        setIsLoading(true);
        setError("");

        try {
            // Convert file to ArrayBuffer on the client side
            const file = files[0];

            const result = await splitPDF(file, parseInt(splitPage));

            // Convert arrays back to Uint8Arrays and then to Blobs
            const firstBlob = new Blob([new Uint8Array(result.firstPart)], { type: "application/pdf" });
            const secondBlob = new Blob([new Uint8Array(result.secondPart)], { type: "application/pdf" });
            setFiles(null);
            setSplitUrls({
                part1: URL.createObjectURL(firstBlob),
                part2: URL.createObjectURL(secondBlob),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to split PDF");
            console.error("Split error:", err);
        } finally {
            setIsLoading(false);
        }
    };


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        const pdfFiles = Array.from(droppedFiles).filter(file => file.type === "application/pdf");

        if (pdfFiles.length === 0) {
            setError("Please drop only PDF files");
            return;
        }

        const dt = new DataTransfer();
        pdfFiles.forEach(file => dt.items.add(file));
        setFiles(dt.files);
        setError("");
    };

    const removeFile = (indexToRemove: number) => {
        if (!files) return;

        const dt = new DataTransfer();
        Array.from(files).forEach((file, index) => {
            if (index !== indexToRemove) {
                dt.items.add(file);
            }
        });

        setFiles(dt.files.length > 0 ? dt.files : null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        PDF Toolkit
                    </h1>
                    <p className="text-slate-600 text-lg">Merge and split PDFs with ease</p>
                </div>

                {/* Main Card */}
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Upload className="w-5 h-5 text-blue-600" />
                            </div>
                            Choose Your Action
                        </CardTitle>
                        <CardDescription>Select whether you want to merge or split your PDFs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value), setFiles(null) }} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="merge" className="flex items-center gap-2">
                                    <Merge className="w-4 h-4" />
                                    Merge PDFs
                                </TabsTrigger>
                                <TabsTrigger value="split" className="flex items-center gap-2">
                                    <Scissors className="w-4 h-4" />
                                    Split PDF
                                </TabsTrigger>
                            </TabsList>

                            {/* Merge Tab */}
                            <TabsContent value="merge" className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="merge-files" className="text-base font-semibold">
                                        Select or Drop PDFs to Merge
                                    </Label>

                                    {/* Drag and Drop Zone */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${isDragging
                                            ? "border-blue-500 bg-blue-50 scale-105"
                                            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                                            }`}
                                    >
                                        <input
                                            id="merge-files"
                                            type="file"
                                            multiple
                                            accept="application/pdf"
                                            onChange={(e) => setFiles(e.target.files)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                                            <div className={`p-4 rounded-full ${isDragging ? "bg-blue-100" : "bg-white"} shadow-md`}>
                                                <Upload className={`w-8 h-8 ${isDragging ? "text-blue-600" : "text-slate-400"}`} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-base font-semibold text-slate-700">
                                                    {isDragging ? "Drop your PDFs here" : "Drag & drop PDFs here"}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">or click to browse files</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File List */}
                                    {files && files.length > 0 && (
                                        <div className="space-y-2">
                                            {Array.from(files).map((file, index) => (
                                                <Alert key={index} className="bg-blue-50 border-blue-200 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                        <AlertDescription className="text-blue-800 text-sm truncate">
                                                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                                        </AlertDescription>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(index)}
                                                        className="h-6 w-6 p-0 hover:bg-blue-100"
                                                    >
                                                        <X className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                </Alert>
                                            ))}
                                            <p className="text-sm text-slate-600 pt-2">
                                                Total: {files.length} file{files.length > 1 ? "s" : ""} selected
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <Alert className="bg-red-50 border-red-200">
                                        <AlertDescription className="text-red-800">
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    onClick={handleMerge}
                                    disabled={!files || isLoading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
                                >
                                    <Merge className="w-5 h-5 mr-2" />
                                    {isLoading ? "Merging..." : "Merge PDFs"}
                                </Button>

                                {mergedUrl && (
                                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <FileText className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-green-900">Merged PDF Ready</p>
                                                        <p className="text-sm text-green-700">Your files have been merged successfully</p>
                                                    </div>
                                                </div>
                                                <Button asChild className="bg-green-600 hover:bg-green-700">
                                                    <a href={mergedUrl} download="merged.pdf">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download
                                                    </a>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Split Tab */}
                            <TabsContent value="split" className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="split-file" className="text-base font-semibold">
                                        Select or Drop PDF to Split
                                    </Label>

                                    {/* Drag and Drop Zone */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${isDragging
                                            ? "border-indigo-500 bg-indigo-50 scale-105"
                                            : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
                                            }`}
                                    >
                                        <input
                                            id="split-file"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => setFiles(e.target.files)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                                            <div className={`p-4 rounded-full ${isDragging ? "bg-indigo-100" : "bg-white"} shadow-md`}>
                                                <Upload className={`w-8 h-8 ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-base font-semibold text-slate-700">
                                                    {isDragging ? "Drop your PDF here" : "Drag & drop PDF here"}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">or click to browse file</p>
                                            </div>
                                        </div>
                                    </div>

                                    {files && files.length > 0 && (
                                        <Alert className="bg-indigo-50 border-indigo-200">
                                            <FileText className="h-4 w-4 text-indigo-600" />
                                            <AlertDescription className="text-indigo-800">
                                                {files[0].name} ({(files[0].size / 1024).toFixed(1)} KB)
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="split-page" className="text-base font-semibold">
                                        Split After Page Number
                                    </Label>
                                    <Input
                                        id="split-page"
                                        type="number"
                                        placeholder="e.g., 5"
                                        value={splitPage}
                                        onChange={(e) => setSplitPage(e.target.value)}
                                        className="h-12 text-base"
                                        min="1"
                                    />
                                </div>

                                {error && (
                                    <Alert className="bg-red-50 border-red-200">
                                        <AlertDescription className="text-red-800">
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    onClick={handleSplit}
                                    disabled={!files || !splitPage || isLoading}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
                                >
                                    <Scissors className="w-5 h-5 mr-2" />
                                    {isLoading ? "Splitting..." : "Split PDF"}
                                </Button>

                                {splitUrls && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                                            <CardContent className="pt-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-violet-100 rounded-lg">
                                                            <FileText className="w-4 h-4 text-violet-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-violet-900">Part 1</p>
                                                            <p className="text-xs text-violet-700">Pages 1-{splitPage}</p>
                                                        </div>
                                                    </div>
                                                    <Button asChild className="w-full bg-violet-600 hover:bg-violet-700">
                                                        <a href={splitUrls.part1} download="part1.pdf">
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download Part 1
                                                        </a>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                                            <CardContent className="pt-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-purple-100 rounded-lg">
                                                            <FileText className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-purple-900">Part 2</p>
                                                            <p className="text-xs text-purple-700">Remaining pages</p>
                                                        </div>
                                                    </div>
                                                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                                                        <a href={splitUrls.part2} download="part2.pdf">
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download Part 2
                                                        </a>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-slate-500 mt-8 text-sm">
                    Secure • Fast • Easy to use
                </p>
            </div>
        </div>
    );
}