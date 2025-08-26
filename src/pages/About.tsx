import { Header } from "@/components/Header";
import { Shield, Zap, Users, Heart } from "lucide-react";
const About = () => {
  const features = [{
    icon: Shield,
    title: "Secure & Private",
    description: "Your files are encrypted and stored securely. We never access your private data."
  }, {
    icon: Zap,
    title: "Lightning Fast",
    description: "Upload and download files at blazing speeds with our optimized infrastructure."
  }, {
    icon: Users,
    title: "Easy Sharing & Converting",
    description: "Share files with anyone, anywhere. Convert between formats instantly with our powerful conversion engine."
  }, {
    icon: Heart,
    title: "Made with Love",
    description: "Built by developers who care about user experience and data privacy."
  }];
  return <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              About <span className="gradient-text">Amble</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Amble is a modern file sharing and conversion platform designed to make sharing, 
              converting, and collaborating on files as simple and secure as possible. Whether you're 
              working with a team or sharing with friends, we've got you covered.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => <div key={index} className="file-card text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>)}
          </div>

          {/* Mission Section */}
          <div className="text-center">
            <div className="file-card max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Members</h2>
              <p className="leading-relaxed mb-6 font-medium text-gray-800 text-xl text-center">Jawad Bin Sarwar, (9EV-3, 12), ACPS 
Araf Abdullah, (9EV-3, 14), ACPS 
Rahian Zahid, (9EV-3, 16), ACPS ZoHait Abdullah</p>
              <p className="text-muted-foreground leading-relaxed">
                Built with modern web technologies and a focus on user experience, Amble 
                represents the future of file sharing and conversion - simple, beautiful, and powerful.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10k+</div>
              <div className="text-sm text-muted-foreground">Files Shared</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default About;