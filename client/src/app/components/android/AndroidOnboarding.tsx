import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Usb,
  Shield,
  Server,
  Link2,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { useNavigate } from "react-router";

const steps = [
  {
    id: 1,
    title: "Connect External Storage",
    description:
      "Plug in your USB drive or SD card to your Android device",
    icon: Usb,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 2,
    title: "Grant Permissions",
    description:
      "Allow access to your external storage device",
    icon: Shield,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: 3,
    title: "Start Storage Node",
    description:
      "Launch the gateway server via relay tunnel",
    icon: Server,
    color: "text-highlight",
    bgColor: "bg-highlight/10",
  },
  {
    id: 4,
    title: "Copy Access Link",
    description:
      "Get your unique public URL",
    icon: Link2,
    color: "text-[#F59E0B]",
    bgColor: "bg-[#F59E0B]/10",
  },
  {
    id: 5,
    title: "Open Web Console",
    description:
      "Access the web dashboard to manage files",
    icon: Monitor,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export function AndroidOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/");
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/95 border-b border-border backdrop-blur-lg shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Setup Guide
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground h-8 text-sm"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card/30 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-xs font-mono text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Step Indicator Dots */}
      <div className="max-w-md mx-auto px-4 py-5">
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((s, index) => (
            <motion.div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "w-1.5 bg-accent"
                  : "w-1.5 bg-muted"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: index === currentStep ? 1 : 0.8 }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto px-4 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <div className="text-center">
              <motion.div
                className={`inline-flex p-5 rounded-2xl ${step.bgColor} mb-6`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <Icon className={`w-10 h-10 ${step.color}`} />
              </motion.div>

              <h3 className="text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Minimal Illustration */}
              <div className="mt-8 p-6 bg-card rounded-xl border border-border shadow-sm">
                <div className="flex items-center justify-center gap-3">
                  {currentStep === 0 && (
                    <>
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Usb className="w-7 h-7 text-primary" />
                      </div>
                      <motion.div
                        className="flex gap-1"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <div className="w-1 h-1 rounded-full bg-primary" />
                      </motion.div>
                      <div className="p-3 bg-accent/10 rounded-xl">
                        <Server className="w-7 h-7 text-accent" />
                      </div>
                    </>
                  )}
                  {currentStep === 1 && (
                    <div className="p-4 bg-accent/10 rounded-2xl">
                      <Shield className="w-9 h-9 text-accent" />
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div className="relative">
                      <div className="p-4 bg-highlight/10 rounded-2xl">
                        <Server className="w-9 h-9 text-highlight" />
                      </div>
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-card"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="font-mono text-xs text-primary p-3 bg-primary/10 rounded-xl border border-primary/20">
                      https://easy-cloud-x7k9m.relay.io
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div className="p-4 bg-accent/10 rounded-2xl">
                      <Monitor className="w-9 h-9 text-accent" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-md mx-auto px-4 py-5 border-t border-border">
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1 h-10"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            Previous
          </Button>
          <Button onClick={handleNext} className="flex-1 bg-primary h-10">
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
