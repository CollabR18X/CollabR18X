import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, HelpCircle, Mail, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const supportRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  category: z.enum(["technical", "account", "billing", "safety", "feature", "other"], {
    required_error: "Please select a category",
  }),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

type SupportRequest = z.infer<typeof supportRequestSchema>;

export default function Help() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SupportRequest>({
    resolver: zodResolver(supportRequestSchema),
    defaultValues: {
      subject: "",
      category: undefined,
      message: "",
      email: user?.email || "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SupportRequest) => {
      const res = await apiRequest("POST", "/api/support", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      toast({
        title: "Support request submitted",
        description: "We've received your request and will get back to you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportRequest) => {
    submitMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Your support request has been submitted successfully. We'll review it and get back to you as soon as possible.
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-4xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground mt-1">We're here to help you</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Contact Support</CardTitle>
            </div>
            <CardDescription>
              Submit a support request and our team will respond as soon as possible.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Quick Help</CardTitle>
            </div>
            <CardDescription>
              Check our FAQ or contact us directly for assistance with your account or the platform.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Submit a Support Request</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you within 24-48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account Problem</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="safety">Safety Concern</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the category that best describes your issue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of your issue" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short summary of what you need help with
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={user?.email || "your@email.com"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      We'll use your account email if not provided
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide as much detail as possible about your issue, question, or request..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any relevant details, error messages, or steps to reproduce the issue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>For urgent safety concerns, please use the Safety Alerts feature in the Community section</li>
                    <li>For account-related issues, include your username or account details</li>
                    <li>For technical issues, please describe what you were doing when the problem occurred</li>
                  </ul>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Submit Support Request
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How do I update my profile?</h3>
            <p className="text-sm text-muted-foreground">
              Go to your profile page and click "Edit Profile" to update your information, photos, and preferences.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How do I report a user?</h3>
            <p className="text-sm text-muted-foreground">
              Visit the Safety Alerts section in the Community menu to report inappropriate behavior or safety concerns.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How do I block someone?</h3>
            <p className="text-sm text-muted-foreground">
              Go to the user's profile and click the block button, or manage blocked users from your account menu.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How long does it take to get a response?</h3>
            <p className="text-sm text-muted-foreground">
              We typically respond within 24-48 hours. Urgent safety concerns are prioritized and may receive faster responses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
